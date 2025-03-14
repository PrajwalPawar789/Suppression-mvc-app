const { checkDatabaseAPI: masterCheckDatabaseAPI, processSingleEntry: masterProcessSingleEntry, processSingleAllClient } = require('./fileController');
const { checkDatabaseAPI: qualityCheckDatabaseAPI, processSingleEntry: qualityProcessSingleEntry } = require('./quality-qualifiedController');
const { checkDatabase } = require('./globalemailsuppression'); // Add this line
const { checkDatabase: invalidCheckDatabaseAPI } = require('./invalidemailControllerforAllSuppCheck'); // Add this line


const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Setup upload directory
const uploadsDir = path.join(__dirname, '../uploads');
!fs.existsSync(uploadsDir) && fs.mkdirSync(uploadsDir, { recursive: true });

// Date formatting helper
function formatDate(inputDate) {
    const date = new Date(inputDate);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
}

// Helper function to update summary counts
// In AllsuppressionController.js - Update the updateSummary function
function updateSummary(type, result, summary) {
    const statusTypes = [
        'Match Status', 
        'Client Code Status', 
        'Date Status', 
        'Email Status', 
        'End Client Status' // Removed LinkedIn Status
    ];

    statusTypes.forEach(statusType => {
        const fullStatusKey = `${type} ${statusType}`;
        const statusValue = result[fullStatusKey];
        
        if (statusValue) {
            if (!summary.statusCounts[fullStatusKey]) {
                summary.statusCounts[fullStatusKey] = {};
            }
            summary.statusCounts[fullStatusKey][statusValue] = 
                (summary.statusCounts[fullStatusKey][statusValue] || 0) + 1;
        }
    });
}

async function processAllSuppression(req, res) {
    try {
        // Validate request
        if (!req.file || !req.body.suppressionTypes?.length) {
            return res.status(400).json({
                success: false,
                error: !req.file ? 'No file uploaded' : 'At least one suppression type must be selected'
            });
        }

        const suppressionTypes = req.body.suppressionTypes;
        const isMaster = suppressionTypes.includes('masterSuppression');
        const isQuality = suppressionTypes.includes('qualitySuppression');
        const isGlobal = suppressionTypes.includes('globalEmailSuppression'); // Check for global suppression
        const isInvalid = suppressionTypes.includes('invalidemail'); // Check for global suppression

        // Validate suppression types
        if (!isMaster && !isQuality && !isGlobal && !isInvalid) { // Update validation
            return res.status(400).json({ success: false, error: 'Invalid suppression type' });
        }

        // Validate and format date
        const leadDate = req.body.leadDate;
        if (!leadDate) {
            return res.status(400).json({ success: false, error: 'Lead date is required' });
        }
        
        const formattedDate = formatDate(leadDate + '-01'); // Add day part for parsing
        console.log(`Formatted date: ${formattedDate}`);

        // Validate client codes
        const masterClientCode = isMaster ? req.body.masterClientCode : null;
        const qualityClientCode = isQuality ? req.body.qualityClientCode : null;

        if (isMaster && !masterClientCode) {
            return res.status(400).json({ success: false, error: 'Master client code is required' });
        }
        if (isQuality && !qualityClientCode) {
            return res.status(400).json({ success: false, error: 'Quality client code is required' });
        }

        // Read Excel file
        const workbook = XLSX.read(fs.readFileSync(req.file.path), { type: 'buffer' });
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        const results = [];
        const summary = { totalRecords: 0, statusCounts: {} };

        for (const row of data) {
            const rowData = {
                firstname: row['First Name'],
                lastname: row['Last Name'],
                emailid: row['Email ID'],
                companyname: row['Company Name'],
                phonenumber: row['Phone Number'],
                linkedinlink: row['linkedinLink'],
                dateFilter: formattedDate // Use formatted date here
            };

            let masterResult = {};
            let qualityResult = {};
            let globalResult = {}; // Add global result
            let invalidResult = {};

            const mockRes = {
                status: (code) => mockRes,
                json: (data) => data,
                send: (data) => data
            };

            // Process Master Suppression
            if (isMaster) {
                let suppressionResult;
                if (masterClientCode === 'All') {
                    suppressionResult = await processSingleAllClient({ ...rowData, dateFilter: formattedDate });
                } else if (masterClientCode === 'MSFT') {
                    const mockReq = {
                        body: {
                            ...rowData,
                            email: rowData.emailid,
                            end_client_name: rowData.companyname,
                            dateFilter: formattedDate
                        }
                    };
                    suppressionResult = await masterProcessSingleEntry(mockReq, mockRes);
                } else {
                    suppressionResult = await masterCheckDatabaseAPI({
                        body: {
                            left3: rowData.firstname?.substring(0, 3),
                            left4: rowData.lastname?.substring(0, 4),
                            email: rowData.emailid,
                            clientCode: masterClientCode,
                            dateFilter: formattedDate,
                            end_client_name: rowData.companyname
                        }
                    }, mockRes);
                }

                masterResult = {
                    'Master Match Status': `Master: ${suppressionResult.matchStatus || 'Unmatch'}`,
                    'Master Client Code Status': `Master: ${suppressionResult.clientCodeStatus || 'Unmatch'}`,
                    'Master Date Status': `Master: ${suppressionResult.dateStatus || 'Fresh Lead GTG'}`,
                    'Master Email Status': `Master: ${suppressionResult.emailStatus || 'Unmatch'}`,
                    'Master LinkedIn Status': `Master: ${suppressionResult.linkedinLinkStatus || 'Unmatch'}`,
                    'Master End Client Status': `Master: ${suppressionResult.end_client_nameStatus || 'Unmatch'}`
                };
            }

            // Process Quality Suppression
            if (isQuality) {
                let suppressionResult;
                console.log(`Using date for query: ${formattedDate}`);
                
                if (qualityClientCode === 'MSFT') {
                    const mockReq = {
                        body: {
                            ...rowData,
                            email: rowData.emailid,
                            end_client_name: rowData.companyname,
                            dateFilter: formattedDate
                        }
                    };
                    suppressionResult = await qualityProcessSingleEntry(mockReq, mockRes);
                } else {
                    suppressionResult = await qualityCheckDatabaseAPI({
                        body: {
                            email: rowData.emailid,
                            clientCode: qualityClientCode,
                            dateFilter: formattedDate,
                            end_client_name: rowData.companyname
                        }
                    }, mockRes);
                }

                console.log('Row Response from Query: ', suppressionResult);
                
                qualityResult = {
                    'Quality Match Status': `Quality: ${suppressionResult.matchStatus || 'Unmatch'}`,
                    'Quality Client Code Status': `Quality: ${suppressionResult.clientCodeStatus || 'Unmatch'}`,
                    'Quality Date Status': `Quality: ${suppressionResult.dateStatus || 'Fresh Lead GTG'}`,
                    'Quality Email Status': `Quality: ${suppressionResult.emailStatus || 'Unmatch'}`,
                    'Quality LinkedIn Status': `Quality: ${suppressionResult.linkedinLinkStatus || 'Unmatch'}`,
                    'Quality End Client Status': `Quality: ${suppressionResult.end_client_nameStatus || 'Unmatch'}`
                };
            }

            // Process Global Email Suppression
            if (isGlobal) {
                const email = rowData.emailid;
                try {
                    const matchStatus = await checkDatabase(email, 'system'); // Use placeholder username
                    globalResult = {
                        'Global Email Status': `Global: ${matchStatus}`
                    };
                } catch (error) {
                    console.error('Global suppression error:', error);
                    globalResult = {
                        'Global Email Status': 'Global: Error'
                    };
                }
            }

            // Process isInvalid Email Suppression
            if (isInvalid) {
                const email = rowData.emailid;
                try {
                    const matchStatus = await invalidCheckDatabaseAPI(email, 'system'); // Use placeholder username
                    invalidResult = {
                        'Invalid Email Status': `Invalid: ${matchStatus}`
                    };
                } catch (error) {
                    console.error('Invalid suppression error:', error);
                    invalidResult = {
                        'Invalid Email Status': 'Global: Error'
                    };
                }
            }

            // Combine results
            const combinedResult = {
                ...row,
                ...masterResult,
                ...qualityResult,
                ...globalResult,
                ...invalidResult
            };

            results.push(combinedResult);
            summary.totalRecords++;

            // Update summary counts
            if (isMaster) updateSummary('Master', masterResult, summary);
            if (isQuality) updateSummary('Quality', qualityResult, summary);
            if (isGlobal) updateSummary('Global', globalResult, summary); 
            if (isInvalid) updateSummary('Quality', invalidResult, summary);

        }

        // Generate Excel file
        const resultWorkbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(resultWorkbook, XLSX.utils.json_to_sheet(results), 'Results');
        const outputFilename = `suppression_results_${Date.now()}.xlsx`;
        XLSX.writeFile(resultWorkbook, path.join(uploadsDir, outputFilename));

        res.json({
            success: true,
            summaryReport: summary,
            outputFile: outputFilename
        });

    } catch (error) {
        console.error('Processing error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Processing error occurred'
        });
    }
}

module.exports = { processAllSuppression };