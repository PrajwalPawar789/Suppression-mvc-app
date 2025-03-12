const { checkDatabaseAPI, processSingleEntry, processSingleAllClient } = require('./fileController');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Setup upload directory
const uploadsDir = path.join(__dirname, '../uploads');
!fs.existsSync(uploadsDir) && fs.mkdirSync(uploadsDir, { recursive: true });

// Process the suppression check
async function processAllSuppression(req, res) {
    try {
        // Validate request
        if (!req.file || !req.body.suppressionTypes?.includes('masterSuppression')) {
            return res.status(400).json({ 
                success: false, 
                error: !req.file ? 'No file uploaded' : 'Invalid suppression type' 
            });
        }

        const { masterClientCode, leadDate } = req.body;

        // Read Excel file
        const workbook = XLSX.read(fs.readFileSync(req.file.path), { type: 'buffer' });
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        // Process each row
        const results = [];
        const summary = { totalRecords: 0, matches: 0, unmatches: 0 };

        for (const row of data) {
            console.log('Row Data:', row); // Debug log to inspect the row data
            // Prepare row data
            const rowData = {
                firstname: row['First Name'],
                lastname: row['Last Name'],
                emailid: row['Email ID'],
                companyname: row['Company Name'],
                phonenumber: row['Phone Number'],
                linkedinlink: row['linkedinLink'],
                dateFilter: leadDate
            };
            console.log('Row Data Prepared:', rowData); // Debug log to inspect prepared row data

            // Get suppression result based on client code
            let suppressionResult;
            const mockRes = { 
                status: function(code) { return this; },
                json: function(data) { return data; },
                send: function(data) { return data; }
            };

            if (masterClientCode === 'All') {
                suppressionResult = await processSingleAllClient(rowData);
            } else if (masterClientCode === 'MSFT') {
                const mockReq = {
                    body: {
                        ...rowData,
                        firstname: rowData.firstname,
                        lastname: rowData.lastname,
                        companyname: rowData.companyname,
                        email: rowData.emailid,
                        phonenumber: rowData.phonenumber,
                        dateFilter: leadDate,
                        linkedinLink: rowData.linkedinlink,
                        end_client_name: rowData.companyname
                    }
                };
                console.log('Mock Request Body:', mockReq.body); // Debug log
                suppressionResult = await processSingleEntry(mockReq, mockRes);
            } else {
                suppressionResult = await checkDatabaseAPI({
                    body: {
                        left3: rowData.firstname.substring(0, 3),
                        left4: rowData.lastname.substring(0, 4),
                        email: rowData.emailid,
                        clientCode: masterClientCode,
                        dateFilter: leadDate,
                        linkedinLink: rowData.linkedinlink,
                        end_client_name: rowData.companyname
                    }
                }, mockRes);
            }

            console.log('Suppression result:', suppressionResult); // Debug log

            // Process result
            const result = {
                ...row,
                'Match Status': `Lead: ${suppressionResult.matchStatus || suppressionResult.match_status || 'Unmatch'}`,
                'Client Code Status': `Lead: ${suppressionResult.clientCodeStatus || suppressionResult.client_code_status || 'Unmatch'}`,
                'Date Status': `Lead: ${suppressionResult.dateStatus || suppressionResult.date_status || 'Fresh Lead GTG'}`,
                'Email Status': `Lead: ${suppressionResult.emailStatus || suppressionResult.email_status || 'Unmatch'}`,
                'LinkedIn Status': `Lead: ${suppressionResult.linkedinLinkStatus || suppressionResult.linkedin_link_status || 'Unmatch'}`,
                'End Client Status': `Lead: ${suppressionResult.end_client_nameStatus || suppressionResult.end_client_name_status || 'Unmatch'}`
            };

            results.push(result);
            summary.totalRecords++;
        }

        // Create and save Excel file
        const resultWorkbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(resultWorkbook, XLSX.utils.json_to_sheet(results), 'Results');
        
        const outputFilename = `suppression_results_${Date.now()}.xlsx`;
        XLSX.writeFile(resultWorkbook, path.join(uploadsDir, outputFilename));

        // After writing the file
        console.log(`File created at: ${path.join(uploadsDir, outputFilename)}`);

        // Send response
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