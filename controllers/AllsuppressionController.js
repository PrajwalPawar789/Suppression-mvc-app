const fileController = require('./fileController');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { checkDatabaseAPI, processSingleEntry, processSingleAllClient } = require('./fileController');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Export controller functions directly
exports.renderSuppressionCheck = (req, res) => {
    try {
        res.render('all_suppression_check', {
            title: 'All Suppression Check'
        });
    } catch (error) {
        console.error('Error rendering page:', error);
        res.status(500).send('Error loading page');
    }
};

exports.processSuppressionCheck = async (req, res) => {
    try {
        console.log('Processing suppression check request');
        console.log('Request body:', req.body);
        console.log('File:', req.file);

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const {
            masterClientCode,
            qualityClientCode,
            leadDate,
            suppressionTypes
        } = req.body;

        // Process master suppression if selected
        if (suppressionTypes === 'masterSuppression') {
            console.log('Processing master suppression');
            const results = await processMasterSuppression(
                req.file.path,
                masterClientCode,
                leadDate
            );
            
            return res.json({
                success: true,
                results: results
            });
        } else {
            return res.status(400).json({ 
                success: false, 
                error: 'No valid suppression type selected' 
            });
        }
    } catch (error) {
        console.error('Error processing suppression check:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error processing suppression check'
        });
    }
};

// Helper function to process master suppression
async function processMasterSuppression(filePath, clientCode, dateFilter) {
    try {
        console.log(`Processing master suppression for client: ${clientCode}, date: ${dateFilter}`);
        
        // Read Excel file
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1);
        
        if (!worksheet) {
            throw new Error('No worksheet found in the Excel file');
        }

        // Validate required columns
        const requiredColumns = ['First Name', 'Last Name', 'Email ID', 'Company Name', 'Phone', 'linkedinLink'];
        const headerRow = worksheet.getRow(1).values;
        
        console.log('Header row:', headerRow);
        
        const missingColumns = requiredColumns.filter(col => 
            !headerRow.some(header => header === col)
        );

        if (missingColumns.length > 0) {
            throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
        }

        // Get column indexes
        const columnIndexes = {};
        worksheet.getRow(1).eachCell((cell, colNumber) => {
            columnIndexes[cell.value] = colNumber;
        });
        
        console.log('Column indexes:', columnIndexes);

        // Add status column
        const statusColumn = worksheet.getColumn(worksheet.columnCount + 1);
        statusColumn.header = 'Master Suppression Status';

        const results = {
            totalRecords: 0,
            suppressedRecords: 0,
            cleanRecords: 0,
            matchDetails: []
        };

        // Process each row
        for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
            const row = worksheet.getRow(rowNumber);
            
            // Skip empty rows
            if (!row.getCell(columnIndexes['Email ID']).value) {
                continue;
            }
            
            results.totalRecords++;

            const rowData = {
                firstname: row.getCell(columnIndexes['First Name']).value || '',
                lastname: row.getCell(columnIndexes['Last Name']).value || '',
                emailid: row.getCell(columnIndexes['Email ID']).value || '',
                companyname: row.getCell(columnIndexes['Company Name']).value || '',
                phonenumber: row.getCell(columnIndexes['Phone']).value || '',
                linkedinlink: row.getCell(columnIndexes['linkedinLink']).value || ''
            };

            console.log(`Processing row ${rowNumber}:`, rowData);

            let suppressionResult;

            try {
                if (clientCode === 'All') {
                    // For 'All' client code
                    suppressionResult = await fileController.processSingleAllClient({
                        ...rowData,
                        dateFilter
                    });
                } else if (clientCode === 'MSFT') {
                    // For 'MSFT' client code
                    const mockReq = {
                        body: {
                            ...rowData,
                            dateFilter
                        }
                    };
                    const mockRes = {
                        json: (data) => data
                    };
                    suppressionResult = await fileController.processSingleEntry(mockReq, mockRes);
                } else {
                    // For other client codes (TE16, AR13, etc.)
                    const email = rowData.emailid;
                    
                    const mockReq = {
                        body: {
                            left3: email.substring(0, 3),
                            left4: email.substring(0, 4),
                            email: email,
                            clientCode: clientCode,
                            dateFilter: dateFilter,
                            linkedinLink: rowData.linkedinlink,
                            end_client_name: ''
                        }
                    };
                    const mockRes = {
                        json: (data) => data
                    };
                    
                    suppressionResult = await fileController.checkDatabaseAPI(mockReq, mockRes);
                }

                console.log('Suppression result:', suppressionResult);

                // Extract status from result
                let status = 'No Match';
                if (suppressionResult) {
                    if (suppressionResult.status) {
                        status = suppressionResult.status;
                    } else if (suppressionResult.matchStatus) {
                        status = suppressionResult.matchStatus;
                    } else if (typeof suppressionResult === 'object' && suppressionResult.match) {
                        status = 'Match';
                    }
                }

                // Update status column
                row.getCell(statusColumn.number).value = status;

                if (status === 'Match') {
                    results.suppressedRecords++;
                }

                results.matchDetails.push({
                    row: rowNumber,
                    email: rowData.emailid,
                    status: status
                });
            } catch (error) {
                console.error(`Error processing row ${rowNumber}:`, error);
                row.getCell(statusColumn.number).value = 'Error';
                results.matchDetails.push({
                    row: rowNumber,
                    email: rowData.emailid,
                    status: 'Error',
                    error: error.message
                });
            }
        }

        // Calculate clean records
        results.cleanRecords = results.totalRecords - results.suppressedRecords;
        
        // Calculate suppression rate
        results.suppressionRate = results.totalRecords > 0 
            ? ((results.suppressedRecords / results.totalRecords) * 100).toFixed(2) 
            : '0.00';

        // Save the updated file
        const outputPath = path.join(uploadsDir, `master_suppression_results_${Date.now()}.xlsx`);
        await workbook.xlsx.writeFile(outputPath);

        return {
            ...results,
            outputFile: outputPath
        };

    } catch (error) {
        console.error('Master suppression processing failed:', error);
        throw new Error(`Master suppression processing failed: ${error.message}`);
    }
}

const processAllSuppression = async (req, res) => {
    try {
        const { masterClientCode, leadDate } = req.body;
        const suppressionTypes = Array.isArray(req.body.suppressionTypes) 
            ? req.body.suppressionTypes 
            : [req.body.suppressionTypes];

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        // Read the uploaded file using fs
        const fileBuffer = fs.readFileSync(req.file.path);
        
        // Read the Excel file
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        const results = [];
        
        // Initialize summary counters
        const summary = {
            totalRecords: 0,
            dateStatus: new Map(),
            matchStatus: new Map(),
            emailStatus: new Map(),
            clientCodeStatus: new Map(),
            linkedInStatus: new Map(),
            endClientStatus: new Map()
        };

        // Only process if master suppression is selected
        if (suppressionTypes.includes('masterSuppression')) {
            for (const row of data) {
                let suppressionResult;

                try {
                    if (masterClientCode === 'All') {
                        // Process for all clients
                        suppressionResult = await processSingleAllClient({
                            firstname: row['First Name'],
                            lastname: row['Last Name'],
                            companyname: row['Company Name'],
                            phonenumber: row['Phone'],
                            linkedinlink: row['LinkedinLink'],
                            emailid: row['Email ID'],
                            dateFilter: leadDate
                        });
                    } else if (masterClientCode === 'MSFT') {
                        // Special processing for MSFT
                        const mockReq = {
                            body: {
                                firstname: row['First Name'],
                                lastname: row['Last Name'],
                                companyname: row['Company Name'],
                                phonenumber: row['Phone'],
                                linkedinlink: row['LinkedinLink'],
                                emailid: row['Email ID'],
                                dateFilter: leadDate
                            }
                        };
                        const mockRes = {
                            status: function(code) {
                                return this;
                            },
                            json: function(data) {
                                return data;
                            },
                            send: function(data) {
                                return data;
                            }
                        };
                        suppressionResult = await processSingleEntry(mockReq, mockRes);
                    } else {
                        // For other specific client codes
                        const email = row['Email ID'];
                        
                        // Create a mock response object with required methods
                        const mockRes = {
                            status: function(code) {
                                return this;
                            },
                            json: function(data) {
                                return data;
                            }
                        };

                        const response = await checkDatabaseAPI({
                            body: {
                                left3: row['First Name'].substring(0, 3),
                                left4: row['Last Name'].substring(0, 4),
                                email: email,
                                clientCode: masterClientCode,
                                dateFilter: leadDate,
                                linkedinLink: row['LinkedinLink'],
                                end_client_name: row['Company Name']
                            }
                        }, mockRes);

                        console.log('Raw API Response:', JSON.stringify(response, null, 2));
                        suppressionResult = response;
                    }

                    // Update summary counters with actual values
                    summary.totalRecords++;

                    // Get the actual status values from the response
                    const resultRow = {
                        'Company Name': row['Company Name'],
                        'First Name': row['First Name'],
                        'Last Name': row['Last Name'],
                        'Email ID': row['Email ID'],
                        'Phone Number': row['Phone'],
                        'linkedinLink': row['LinkedinLink'],
                        'Match Status': suppressionResult.matchStatus || suppressionResult.match_status || 'Unmatch',
                        'Client Code Status': suppressionResult.clientCodeStatus || suppressionResult.client_code_status || 'Unmatch',
                        'Date Status': suppressionResult.dateStatus || suppressionResult.date_status || 'Fresh Lead GTG',
                        'Email Status': suppressionResult.emailStatus || suppressionResult.email_status || 'Unmatch',
                        'LinkedIn Status': suppressionResult.linkedinLinkStatus || suppressionResult.linkedin_link_status || 'Unmatch',
                        'End Client Status': suppressionResult.end_client_nameStatus || suppressionResult.end_client_name_status || 'Unmatch'
                    };

                    console.log('Processing result row:', JSON.stringify(resultRow, null, 2));

                    // Update the counters with actual values
                    const dateStatus = resultRow['Date Status'];
                    const matchStatus = resultRow['Match Status'];
                    const emailStatus = resultRow['Email Status'];
                    const clientCodeStatus = resultRow['Client Code Status'];
                    const linkedInStatus = resultRow['LinkedIn Status'];
                    const endClientStatus = resultRow['End Client Status'];

                    summary.dateStatus.set(dateStatus, (summary.dateStatus.get(dateStatus) || 0) + 1);
                    summary.matchStatus.set(matchStatus, (summary.matchStatus.get(matchStatus) || 0) + 1);
                    summary.emailStatus.set(emailStatus, (summary.emailStatus.get(emailStatus) || 0) + 1);
                    summary.clientCodeStatus.set(clientCodeStatus, (summary.clientCodeStatus.get(clientCodeStatus) || 0) + 1);
                    summary.linkedInStatus.set(linkedInStatus, (summary.linkedInStatus.get(linkedInStatus) || 0) + 1);
                    summary.endClientStatus.set(endClientStatus, (summary.endClientStatus.get(endClientStatus) || 0) + 1);

                    results.push(resultRow);

                } catch (error) {
                    console.error(`Error processing row:`, error);
                    const errorRow = {
                        ...row,
                        'Date Status': 'Error',
                        'Match Status': 'Error',
                        'Email Status': 'Error',
                        'Client Code Status': 'Error',
                        'LinkedIn Status': 'Error',
                        'End Client Status': 'Error'
                    };
                    results.push(errorRow);

                    // Update error counters
                    summary.dateStatus.set('Error', (summary.dateStatus.get('Error') || 0) + 1);
                    summary.matchStatus.set('Error', (summary.matchStatus.get('Error') || 0) + 1);
                    summary.emailStatus.set('Error', (summary.emailStatus.get('Error') || 0) + 1);
                    summary.clientCodeStatus.set('Error', (summary.clientCodeStatus.get('Error') || 0) + 1);
                    summary.linkedInStatus.set('Error', (summary.linkedInStatus.get('Error') || 0) + 1);
                    summary.endClientStatus.set('Error', (summary.endClientStatus.get('Error') || 0) + 1);
                }
            }
        }

        console.log('Final Summary:', {
            totalRecords: summary.totalRecords,
            dateStatus: Object.fromEntries(summary.dateStatus),
            matchStatus: Object.fromEntries(summary.matchStatus),
            emailStatus: Object.fromEntries(summary.emailStatus),
            clientCodeStatus: Object.fromEntries(summary.clientCodeStatus),
            linkedInStatus: Object.fromEntries(summary.linkedInStatus),
            endClientStatus: Object.fromEntries(summary.endClientStatus)
        });

        // Convert summary Maps to objects for the report
        const summaryReport = {
            totalRecords: summary.totalRecords,
            dateStatus: Object.fromEntries(summary.dateStatus),
            matchStatus: Object.fromEntries(summary.matchStatus),
            emailStatus: Object.fromEntries(summary.emailStatus),
            clientCodeStatus: Object.fromEntries(summary.clientCodeStatus),
            linkedInStatus: Object.fromEntries(summary.linkedInStatus),
            endClientStatus: Object.fromEntries(summary.endClientStatus)
        };

        // Create a new workbook for results
        const resultWorkbook = XLSX.utils.book_new();

        // Add detailed results sheet first (as the main sheet)
        const resultSheet = XLSX.utils.json_to_sheet(results, {
            header: [
                'Company Name',
                'First Name',
                'Last Name',
                'Email ID',
                'Phone Number',
                'linkedinLink',
                'Match Status',
                'Client Code Status',
                'Date Status',
                'Email Status',
                'LinkedIn Status',
                'End Client Status'
            ]
        });
        XLSX.utils.book_append_sheet(resultWorkbook, resultSheet, 'Results');

        // Add summary sheet as second sheet
        const summaryData = [
            ['Master Suppression Summary Report'],
            ['Total Records Processed', summary.totalRecords],
            [''],
            ['Date Status Breakdown'],
            ...Array.from(summary.dateStatus.entries()).map(([status, count]) => [status, count]),
            [''],
            ['Match Status Breakdown'],
            ...Array.from(summary.matchStatus.entries()).map(([status, count]) => [status, count]),
            [''],
            ['Email Status Breakdown'],
            ...Array.from(summary.emailStatus.entries()).map(([status, count]) => [status, count]),
            [''],
            ['Client Code Status Breakdown'],
            ...Array.from(summary.clientCodeStatus.entries()).map(([status, count]) => [status, count]),
            [''],
            // ['LinkedIn Status Breakdown'],
            // ...Array.from(summary.linkedInStatus.entries()).map(([status, count]) => [status, count]),
            // [''],
            ['End Client Status Breakdown'],
            ...Array.from(summary.endClientStatus.entries()).map(([status, count]) => [status, count])
        ];

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(resultWorkbook, summarySheet, 'Summary');

        // Save the file
        const outputFilename = `suppression_results_${Date.now()}.xlsx`;
        const outputPath = path.join(uploadsDir, outputFilename);
        XLSX.writeFile(resultWorkbook, outputPath);

        // Send both the summary report and filename
        res.json({
            success: true,
            summaryReport: summaryReport,
            outputFile: outputFilename
        });

    } catch (error) {
        console.error('Error in processAllSuppression:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'An error occurred during suppression check'
        });
    }
};

module.exports = {
    processAllSuppression
};