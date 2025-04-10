const { checkDatabaseAPI: masterCheckDatabaseAPI, processSingleEntry: masterProcessSingleEntry, processSingleAllClient } = require('./fileController');
const { checkDatabaseAPI: qualityCheckDatabaseAPI, processSingleEntry: qualityProcessSingleEntry } = require('./quality-qualifiedController');
const { checkDatabase } = require('./globalemailsuppression'); // Add this line
const { checkDatabase: invalidCheckDatabaseAPI } = require('./invalidemailControllerforAllSuppCheck'); // Add this line
const { checkDatabase: TPCCTPSSupressionAPI } = require('./TPCCTPSSupressionController'); // Add this line
const { checkDatabase: dncCheckDatabase } = require('./dncsuppression');
const { checkDatabase: te16MsftDomainCheck } = require('./TE16_MSFT_Accept_all_domain_suppression');
const { checkDatabase: msftClientCheck } = require('./msft_client_suppression');
const { checkDatabase: msftDomainCheck } = require('./msft_domain_suppression');
const logger = require('./logger');

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
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
}

// In AllsuppressionController.js - Update the updateSummary function
function updateSummary(type, result, summary) {
    let statusTypes = [];

    if (type === 'DNC') {
        statusTypes = [
            'Email Status',
            'Full Name and Domain Status',
            'DNC Company Status',
            'DNC Domain Status'
        ];
    } else if (type === 'TPCCTPS') {
        statusTypes = ['Status'];
    } else if (type === 'TE16Msft') {
        statusTypes = ['Domain Status'];
    } else if (type === 'MSFT') {
        statusTypes = ['Client Status', 'Domain Status'];
    } else {
        statusTypes = [
            'Match Status',
            'Client Code Status',
            'Date Status',
            'Email Status',
            'End Client Status'
        ];
    }

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

function renderTPCCTPSStatus(counts) {
    return `
    <div class="status-card">
        <div class="status-header">TPCCTPS Status</div>
        <div class="status-values">
            ${Object.entries(counts).map(([status, count]) => `
                <div class="status-item">
                    <span class="status-value">${status.replace('TPCCTPS: ', '')}</span>
                    <span class="status-count">${count}</span>
                </div>
            `).join('')}
        </div>
    </div>`;
}

async function processAllSuppression(req, res) {
    try {
        const username = req.session.username;

        console.log(`${username} checking all suppression at once`)
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
        const isTPCCTPSSupression = suppressionTypes.includes('tpcctpsSuppression')
        const isDNC = suppressionTypes.includes('deadContact');
        const isTE16MsftDomain = suppressionTypes.includes('te16MsftDomain');
        const isMsftSuppression = suppressionTypes.includes('msftSuppression');

        // Validate suppression types
        if (!isMaster && !isQuality && !isGlobal && !isInvalid &&
            !isTPCCTPSSupression && !isDNC && !isTE16MsftDomain && !isMsftSuppression) {
            return res.status(400).json({ success: false, error: 'Invalid suppression type' });
        }

        // Validate and format date
        const leadDate = req.body.leadDate;
        const qualityleadDate = req.body.qualityleadDate;

        if (!leadDate) {
            return res.status(400).json({ success: false, error: 'Lead date is required' });
        }

        const formattedDate = formatDate(leadDate);
        const qualityformattedDate = formatDate(qualityleadDate); // Add day part for parsing


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

        let leadIndex = 0;

        for (const row of data) {
            leadIndex++;  // Increment first to start counting from 1

            const rowData = {
                firstname: row['First Name'],
                lastname: row['Last Name'],
                emailid: row['Email ID'],
                companyname: row['Company Name'],
                phonenumber: row['Phone Number'],
                linkedinlink: row['linkedinLink'],
                domain: row['Domain'], // Add this line to capture domain from Excel
                dateFilter: formattedDate
            };


            let masterResult = {};
            let qualityResult = {};
            let globalResult = {}; // Add global result
            let invalidResult = {};
            let isTPCCTPSResult = {};
            let dncResult = {};
            let te16MsftResult = {};
            let msftResult = {};

            const mockRes = {
                status: (code) => mockRes,
                json: (data) => data,
                send: (data) => data
            };

            // Process Master Suppression
            if (isMaster) {
                let suppressionResult;

                // Generate combined left3 and left4 values from first 3 letters of firstname, lastname, companyname
                const left3Combined =
                    (rowData.firstname?.substring(0, 3) || '') +
                    (rowData.lastname?.substring(0, 3) || '') +
                    (rowData.companyname?.substring(0, 3) || '');


                const left4Combined = left3Combined; // As per user instruction, left4 uses the same combination

                logger.info(`${username} checked Master suppression for lead ${leadIndex - 1}: email=${rowData.emailid}, left3=${left3Combined}, left4=${left4Combined}, linkedinLink=${rowData.linkedinlink}`);

                if (masterClientCode === 'All') {
                    suppressionResult = await processSingleAllClient({ ...rowData, dateFilter: formattedDate });
                    //console.log('logging masterClientCode === All', )
                } else if (masterClientCode === 'MSFT') {
                    console.log("Logging MSFT rowData", rowData)
                    const mockReq = {
                        body: {
                            ...rowData,
                            email: rowData.emailid,
                            end_client_name: rowData.companyname,
                            dateFilter: formattedDate
                        }
                    };
                    suppressionResult = await masterProcessSingleEntry(mockReq, mockRes);
                    console.log("suppressionResult for All client code ckeck", suppressionResult);

                } else {
                    suppressionResult = await masterCheckDatabaseAPI({
                        body: {
                            left3: left3Combined, // Use combined value
                            left4: left4Combined, // Use combined value
                            email: rowData.emailid,
                            clientCode: masterClientCode,
                            dateFilter: formattedDate,
                            end_client_name: rowData.companyname
                        }
                    }, mockRes);
                    // console.log('suppressionResult for single client ckeck',suppressionResult)
                }

                masterResult = {
                    'Master Match Status': `Master: ${suppressionResult.matchStatus || 'Unmatch'}`,
                    'Master Client Code Status': `Master: ${suppressionResult.clientCodeStatus || 'Unmatch'}`,
                    'Master Date Status': `Master: ${suppressionResult.dateStatus || 'Fresh Lead GTG'}`,
                    'Master Email Status': `Master: ${suppressionResult.emailStatus || 'Unmatch'}`,
                    'Master LinkedIn Status': `Master: ${suppressionResult.linkedinLinkStatus || 'Unmatch'}`,
                    'Master End Client Status': `Master: ${suppressionResult.end_client_nameStatus || 'Unmatch'}`
                };

                // Change from camelCase to snake_case property access
// masterResult = {
//     'Master Match Status': `Master: ${suppressionResult.match_status || 'Unmatch'}`, // was .matchStatus
//     'Master Client Code Status': `Master: ${suppressionResult.client_code_status || 'Unmatch'}`, // was .clientCodeStatus
//     'Master Date Status': `Master: ${suppressionResult.date_status || 'Fresh Lead GTG'}`, // was .dateStatus
//     'Master Email Status': `Master: ${suppressionResult.email_status || 'Unmatch'}`, // was .emailStatus
//     'Master LinkedIn Status': `Master: ${suppressionResult.linkedin_link_status || 'Unmatch'}`, // was .linkedinLinkStatus
//     'Master End Client Status': `Master: ${suppressionResult.end_client_name_status || 'Unmatch'}` // was .end_client_nameStatus
//   };
            }

            // Process Quality Suppression
            if (isQuality) {
                let suppressionResult;

                logger.info(`${username} checked Quality suppression for lead ${leadIndex - 1}: email=${rowData.emailid}, clientCode=${qualityClientCode}, endClient=${rowData.companyname}`);

                // console.log(`Using date for query: ${qualityformattedDate}`);

                if (qualityClientCode === 'MSFT') {
                    const mockReq = {
                        body: {
                            ...rowData,
                            email: rowData.emailid,
                            end_client_name: rowData.companyname,
                            dateFilter: qualityformattedDate
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


                qualityResult = {
                    'Quality Match Status': `Quality: ${suppressionResult.matchStatus || 'Unmatch'}`,
                    'Quality Client Code Status': `Quality: ${suppressionResult.clientCodeStatus || 'Unmatch'}`,
                    'Quality Date Status': `Quality: ${suppressionResult.dateStatus || 'Fresh Lead GTG'}`,
                    'Quality Email Status': `Quality: ${suppressionResult.emailStatus || 'Unmatch'}`,
                    'Quality LinkedIn Status': `Quality: ${suppressionResult.linkedinLinkStatus || 'Unmatch'}`,
                    'Quality End Client Status': `Quality: ${suppressionResult.end_client_nameStatus || 'Unmatch'}`
                };

//   console.log("Suppression Result Raw:", suppressionResult);

            }

            // Process Global Email Suppression
            if (isGlobal) {
                const email = rowData.emailid;

                logger.info(`${username} checked Global suppression for lead ${leadIndex - 1}: email=${rowData.emailid}`);

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

                logger.info(`${username} checked Invalid Email suppression for lead ${leadIndex - 1}: email=${rowData.emailid}`);

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

            if (isTPCCTPSSupression) {
                const phonenumber = rowData.phonenumber;

                logger.info(`${username} checked TPCCTPS suppression for lead ${leadIndex - 1}: phoneNumber=${rowData.phonenumber}`);

                try {
                    const matchStatus = await TPCCTPSSupressionAPI(phonenumber, 'system'); // Use placeholder username
                    isTPCCTPSResult = {
                        'TPCCTPS Status': `TPCCTPS Status: ${matchStatus}`
                    };
                    console.log("Output in isTPCCTPSSupression", isTPCCTPSResult)
                } catch (error) {
                    console.error('TPCCTPS Status error:', error);
                    isTPCCTPSResult = {
                        'TPCCTPS Status': 'TPCCTPS: Error'
                    };
                }
            }

            if (isDNC) {

                const fullNameAndDomain = (rowData.firstname || '') + (rowData.lastname || '') + (rowData.domain || '');

                logger.info(`${username} checked DNC suppression for lead ${leadIndex - 1}: email=${rowData.emailid}, company=${rowData.companyname}, domain=${rowData.domain}, firstname=${rowData.firstname}, lastname=${rowData.lastname}`);

                try {
                    const dncResponse = await dncCheckDatabase(
                        rowData.emailid,
                        rowData.companyname,
                        rowData.domain,
                        fullNameAndDomain,
                        'system'
                    );
                    logger.info(`dnc responce Check--> ${dncResponse.fullname_and_domain_status}`)
                    dncResult = {
                        'DNC Email Status': `DNC: ${dncResponse.email_status}`,
                        'DNC Full Name and Domain Status': `DNC: ${dncResponse.fullname_and_domain_status}`,
                        'DNC DNC Company Status': `DNC: ${dncResponse.dnc_company_status}`,
                        'DNC DNC Domain Status': `DNC: ${dncResponse.dnc_domain_status}`
                    };
                } catch (error) {
                    console.error('DNC check error:', error);
                    dncResult = {
                        'DNC Email Status': 'DNC: Error',
                        'DNC Full Name and Domain Status':'DNC: Error',
                        'DNC Company Status': 'DNC: Error',
                        'DNC Domain Status': 'DNC: Error'
                    };
                }
            }

            // Process TE16 MSFT Domain Suppression
            if (isTE16MsftDomain) {

                logger.info(`${username} checked TE16 MSFT Domain suppression for lead ${leadIndex - 1}: domain=${rowData.domain}`);

                try {
                    const domainResponse = await te16MsftDomainCheck(rowData.domain, 'system');
                    te16MsftResult = {
                        // Access the status property from the response object
                        'TE16Msft Domain Status': `TE16Msft: ${domainResponse.status}`
                    };
                } catch (error) {
                    console.error('TE16 MSFT Domain check error:', error);
                    te16MsftResult = {
                        'TE16Msft Domain Status': 'TE16Msft: Error'
                    };
                }
            }

            // Process MSFT Suppression
            if (isMsftSuppression) {

                logger.info(`${username} checked MSFT suppression for lead ${leadIndex - 1}: email=${rowData.emailid}, domain=${rowData.domain}`);

                try {
                    // Client check
                    const clientStatus = await msftClientCheck(rowData.emailid, 'system');
                    // Domain check
                    const domainStatus = await msftDomainCheck(rowData.domain, 'system');

                    msftResult = {
                        'MSFT Client Status': `MSFT: ${clientStatus}`,
                        'MSFT Domain Status': `MSFT: ${domainStatus}`
                    };
                } catch (error) {
                    console.error('MSFT check error:', error);
                    msftResult = {
                        'MSFT Client Status': 'MSFT: Error',
                        'MSFT Domain Status': 'MSFT: Error'
                    };
                }
            }

            // Combine results
            const combinedResult = {
                ...row,
                ...masterResult,
                ...qualityResult,
                ...globalResult,
                ...invalidResult,
                ...isTPCCTPSResult,
                ...dncResult,
                ...te16MsftResult,
                ...msftResult
            };

            // Calculate Final Status based on selected suppressions
            let finalStatus = '';

            // Master Suppression: Match if Master Date Status is "Still Suppressed"
            if (isMaster && combinedResult['Master Date Status'] === 'Master: Still Suppressed') {

                finalStatus = finalStatus + 'Master Match | ';
            }

            // Quality Suppression: Match if Quality Date Status is "Still Suppressed"
            if (isQuality && combinedResult['Quality Date Status'] === 'Quality: Still Suppressed') {
                finalStatus = finalStatus + 'QQ Match | ';
            }

            // Global Email: Direct match check
            if (isGlobal && combinedResult['Global Email Status'] === 'Global: Match') {
                finalStatus = finalStatus + 'Global Email Match | ';
            }

            // Invalid Email: Direct match check
            if (isInvalid && combinedResult['Invalid Email Status'] === 'Invalid: Match') {
                finalStatus = finalStatus + 'Invalid Email Match | ';
            }

            // TPCCTPS: Direct match check
            if (isTPCCTPSSupression && combinedResult['TPCCTPS Status'] === 'TPCCTPS Status: Match') {
                finalStatus = finalStatus + 'TPCCTPS Match | ';
            }

            // DNC: Check if any DNC column is "Match"
            if (isDNC) {
                const dncColumns = [
                    'DNC Email Status',
                    'DNC DNC Full Name and Domain Status',
                    'DNC DNC Company Status',
                    'DNC DNC Domain Status'
                ];
                if (dncColumns.some(col => combinedResult[col] === 'DNC: Match')) {
                    finalStatus = finalStatus + 'DNC Match | ';
                }
            }

            // TE16Msft Domain: Direct match check
            if (isTE16MsftDomain && combinedResult['TE16Msft Domain Status'] === 'TE16Msft: Match') {
                ffinalStatus = finalStatus + 'TE16Msft Accept All Domain Match | ';
            }

            // MSFT: Check Client or Domain match
            if (isMsftSuppression) {
                if (combinedResult['MSFT Client Status'] === 'MSFT: Match' || combinedResult['MSFT Domain Status'] === 'MSFT: Match') {
                    finalStatus = finalStatus + 'MSFT Client or Domain Match | ';
                }
            }

            if (finalStatus === '') {
                finalStatus = "Unmatch";
            }

            // Add Final Status to the result
            combinedResult['Final Status'] = finalStatus;

            results.push(combinedResult);
            summary.totalRecords++;

            // Update summary counts
            if (isMaster) updateSummary('Master', masterResult, summary);
            if (isQuality) updateSummary('Quality', qualityResult, summary);
            if (isGlobal) updateSummary('Global', globalResult, summary);
            if (isInvalid) updateSummary('Invalid', invalidResult, summary);
            if (isTPCCTPSSupression) updateSummary('TPCCTPS', isTPCCTPSResult, summary);
            if (isDNC) updateSummary('DNC', dncResult, summary);
            if (isTE16MsftDomain) updateSummary('TE16Msft', te16MsftResult, summary);
            if (isMsftSuppression) updateSummary('MSFT', msftResult, summary);


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