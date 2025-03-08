const fileController = require('./fileController');
const quality_qualifiedController = require('./quality-qualifiedController');
const invalidemailController = require('./invalidemail');
const globalemailsuppression = require('./globalemailsuppression');
const msft_client_suppression = require('./msft_client_suppression');
const msft_domain_suppression = require('./msft_domain_suppression');
const invalidemail = require('./invalidemail');
const invalidemailController1 = require('./invalidemailController');
const globalemailController = require('../globalemailController');
const dncCompanyController = require('../dnc_companyController');
const dncSuppressionController = require('./dnc_suppressionController');
const TPCCTPSSupressionController = require('./TPCCTPSSupressionController');
const DeadContactController = require('./DeadContactController');
const TE16_MSFT_Accept_all_domain_suppression = require('./TE16_MSFT_Accept_all_domain_suppression');

class AllSuppressionController {
    // Render the suppression check page
    async renderSuppressionCheck(req, res) {
        try {
            res.render('all_suppression_check', {
                title: 'All Suppression Check'
            });
        } catch (error) {
            console.error('Error rendering page:', error);
            res.status(500).send('Error loading page');
        }
    }

    // Process the file and perform all selected suppression checks
    async processSuppressionCheck(req, res) {
        try {
            const {
                masterClientCode,
                qualityClientCode,
                leadDate,
                suppressionTypes
            } = req.body;

            const file = req.file;
            if (!file) {
                return res.status(400).json({ success: false, error: 'No file uploaded' });
            }

            // Read and validate file
            const fileData = await fileController.readAndValidateFile(file);
            
            // Initialize results object
            const results = {
                totalRecords: fileData.length,
                suppressionResults: {}
            };

            // Process each selected suppression type
            if (suppressionTypes.includes('masterSuppression')) {
                results.suppressionResults.masterSuppression = 
                    await this.processMasterSuppression(fileData, masterClientCode);
            }

            if (suppressionTypes.includes('qualitySuppression')) {
                results.suppressionResults.qualitySuppression = 
                    await quality_qualifiedController.checkSuppression(fileData, qualityClientCode);
            }

            if (suppressionTypes.includes('deadContact')) {
                results.suppressionResults.deadContact = 
                    await DeadContactController.checkDeadContacts(fileData);
            }

            if (suppressionTypes.includes('invalidemail')) {
                results.suppressionResults.invalidEmail = 
                    await invalidemailController.checkInvalidEmails(fileData);
            }

            if (suppressionTypes.includes('te16Globalemail')) {
                results.suppressionResults.te16GlobalEmail = 
                    await globalemailController.checkGlobalEmails(fileData);
            }

            if (suppressionTypes.includes('te16MsftDomain')) {
                results.suppressionResults.te16MsftDomain = 
                    await TE16_MSFT_Accept_all_domain_suppression.checkDomains(fileData);
            }

            if (suppressionTypes.includes('msftSuppression')) {
                results.suppressionResults.msftSuppression = 
                    await msft_client_suppression.checkMsftSuppression(fileData);
            }

            if (suppressionTypes.includes('tpcctpsSuppression')) {
                results.suppressionResults.tpcctpsSuppression = 
                    await TPCCTPSSupressionController.checkPhoneNumbers(fileData);
            }

            // Calculate final results and statistics
            const finalResults = await this.calculateFinalResults(results);

            res.json({
                success: true,
                results: finalResults
            });

        } catch (error) {
            console.error('Error processing suppression check:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Error processing suppression check'
            });
        }
    }

    // Process master suppression check
    async processMasterSuppression(data, clientCode) {
        try {
            // Implement master suppression logic
            const suppressionResults = await dncSuppressionController.checkSuppression(data, clientCode);
            return suppressionResults;
        } catch (error) {
            throw new Error(`Master suppression check failed: ${error.message}`);
        }
    }

    // Calculate final results and statistics
    async calculateFinalResults(results) {
        try {
            const finalResults = {
                totalRecords: results.totalRecords,
                suppressedRecords: 0,
                cleanRecords: 0,
                suppressionBreakdown: {},
                suppressedData: []
            };

            // Process each suppression type results
            for (const [type, result] of Object.entries(results.suppressionResults)) {
                finalResults.suppressionBreakdown[type] = {
                    count: result.suppressedRecords?.length || 0,
                    percentage: ((result.suppressedRecords?.length || 0) / results.totalRecords * 100).toFixed(2)
                };
                
                finalResults.suppressedRecords += result.suppressedRecords?.length || 0;
                
                // Merge suppressed data
                if (result.suppressedRecords) {
                    finalResults.suppressedData = [
                        ...finalResults.suppressedData,
                        ...result.suppressedRecords.map(record => ({
                            ...record,
                            suppressionType: type
                        }))
                    ];
                }
            }

            finalResults.cleanRecords = results.totalRecords - finalResults.suppressedRecords;
            finalResults.suppressionRate = ((finalResults.suppressedRecords / results.totalRecords) * 100).toFixed(2);

            return finalResults;

        } catch (error) {
            throw new Error(`Error calculating final results: ${error.message}`);
        }
    }
}

module.exports = new AllSuppressionController();