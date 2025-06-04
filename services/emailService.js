const ImapSimple = require('imap-simple');
const simpleParser = require('mailparser').simpleParser;

class EmailService {
    constructor() {
        if (!process.env.MAIL_USERNAME || !process.env.MAIL_PASSWORD) {
            throw new Error('Email credentials are not configured. Please check your .env file');
        }

        this.config = {
            imap: {
                user: process.env.MAIL_USERNAME,
                password: process.env.MAIL_PASSWORD,
                host: process.env.MAIL_HOST || 'imap.gmail.com',
                port: parseInt(process.env.MAIL_PORT) || 993,
                tls: true,
                tlsOptions: { rejectUnauthorized: false },
                authTimeout: 3000,
                debug: console.log
            }
        };
    }

    async connect() {
        try {
            console.log('Attempting to connect to email server...');
            console.log(`Host: ${this.config.imap.host}`);
            console.log(`Port: ${this.config.imap.port}`);
            console.log(`Username: ${this.config.imap.user}`);
            
            this.connection = await ImapSimple.connect(this.config);
            console.log('Successfully connected to email server');
            return this.connection;
        } catch (error) {
            console.error('Detailed connection error:', error);
            
            if (error.message.includes('Invalid credentials')) {
                throw new Error('Invalid email credentials. Please check your MAIL_USERNAME and MAIL_PASSWORD in .env file. For Gmail, make sure you\'re using an App Password.');
            } else if (error.message.includes('getaddrinfo')) {
                throw new Error(`Cannot connect to email server ${this.config.imap.host}. Please check your MAIL_HOST and internet connection.`);
            } else if (error.message.includes('timeout')) {
                throw new Error('Connection timed out. Please check your internet connection and email server settings.');
            }
            
            throw error;
        }
    }

    getLast30DaysDate() {
        const date = new Date();
        date.setDate(date.getDate() - 400);
        return date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).replace(/,/g, '');
    }

    async getNewApplicationEmails() {
        try {
            await this.connection.openBox('INBOX');
            
            const thirtyDaysAgo = this.getLast30DaysDate();
            console.log(`Searching for emails since: ${thirtyDaysAgo}`);

            // Search for emails from LinkedIn and Indeed in the last 30 days
            const searchCriteria = [
                ['SINCE', thirtyDaysAgo],
                ['OR',
                    ['FROM', 'linkedin.com'],
                    ['FROM', 'indeed.com']
                ]
            ];
            
            const messages = await this.connection.search(searchCriteria, {
                bodies: ['HEADER', 'TEXT', 'HEADER.FIELDS (SUBJECT FROM DATE)'],
                markSeen: false
            });

            console.log(`Found ${messages.length} messages from the last 40 days`);
            const applications = [];
            const errors = [];

            for (const message of messages) {
                try {
                    console.log('\nProcessing message:', message.attributes.uid);
                    
                    // Get the header info first
                    const header = message.parts.find(p => p.which === 'HEADER');
                    let headerInfo = null;
                    try {
                        headerInfo = header ? await simpleParser(header.body) : null;
                        console.log('Header parsed successfully');
                    } catch (headerError) {
                        console.error('Error parsing header:', headerError.message);
                    }

                    // Get the message body
                    const body = message.parts.find(p => p.which === 'TEXT');
                    if (!body) {
                        console.error('No TEXT part found in message');
                        continue;
                    }

                    let parsed;
                    try {
                        parsed = await simpleParser(body.body);
                        console.log('Body parsed successfully');
                    } catch (bodyError) {
                        console.error('Error parsing body:', bodyError.message);
                        errors.push({
                            messageId: message.attributes.uid,
                            error: bodyError.message
                        });
                        continue;
                    }

                    // Try to get basic information even if parsing fails
                    const basicInfo = {
                        messageId: message.attributes.uid,
                        receivedDate: message.attributes.date,
                        emailTitle: headerInfo?.subject || 'No Subject',
                        from: headerInfo?.from?.text || 'Unknown Sender'
                    };

                    const application = this.parseApplicationEmail(parsed, headerInfo);
                    if (application) {
                        applications.push({
                            ...application,
                            ...basicInfo
                        });
                        console.log('Successfully parsed application data');
                    } else {
                        console.log('No application data found in message');
                        errors.push({
                            ...basicInfo,
                            error: 'No application data found',
                            rawText: parsed.text.substring(0, 200) + '...'
                        });
                    }
                } catch (parseError) {
                    console.error('Error processing message:', parseError);
                    errors.push({
                        messageId: message.attributes.uid,
                        error: parseError.message
                    });
                }
            }

            console.log(`\nProcessing Summary:`);
            console.log(`Total messages: ${messages.length}`);
            console.log(`Successfully parsed: ${applications.length}`);
            console.log(`Errors: ${errors.length}`);
            
            if (errors.length > 0) {
                console.log('\nParsing Errors:', JSON.stringify(errors, null, 2));
            }

            return {
                applications,
                errors,
                summary: {
                    total: messages.length,
                    successful: applications.length,
                    failed: errors.length
                }
            };
        } catch (error) {
            console.error('Error fetching emails:', error);
            throw error;
        }
    }

    parseApplicationEmail(email, headerInfo = null) {
        try {
            // First try to get text content from different possible sources
            const textContent = email.text || email.textAsHtml || email.html || '';
            
            // Extract relevant information using regex patterns
            const namePattern = /(?:Name:|Applicant:|Full Name:|Candidate:|Applicant Name:)\s*([^\n]+)/i;
            const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i;
            const resumePattern = /(https?:\/\/[^\s]+(?:resume|cv|profile|document)[^\s]*)/i;
            const phonePattern = /(?:Phone:|Mobile:|Tel:|Contact:)\s*([\+\d\s-()]{10,})/i;
            const positionPattern = /(?:Position:|Job Title:|Role:|Applied for:|Job:)\s*([^\n]+)/i;

            const name = email.text.match(namePattern)?.[1]?.trim() ||
                        headerInfo?.subject?.match(/from\s+([^-]+)/i)?.[1]?.trim();
            
            const applicantEmail = email.text.match(emailPattern)?.[1] ||
                                 headerInfo?.from?.value?.[0]?.address;
            
            const resumeLink = email.text.match(resumePattern)?.[1] ||
                             email.attachments?.find(a => /resume|cv/i.test(a.filename))?.filename;
            
            const phone = email.text.match(phonePattern)?.[1]?.trim();
            
            const position = email.text.match(positionPattern)?.[1]?.trim() || 
                           headerInfo?.subject?.replace(/(?:RE:|FWD:)/gi, '').trim() ||
                           email.subject?.replace(/(?:RE:|FWD:)/gi, '').trim();

            // Log what we found for debugging
            console.log('Parsed fields:', {
                name: name || 'Not found',
                email: applicantEmail || 'Not found',
                position: position || 'Not found'
            });

            if (!name && !applicantEmail) {
                return null;
            }

            return {
                name: name || 'Unknown',
                email: applicantEmail || 'No email provided',
                resumeLink: resumeLink || '',
                phone: phone || '',
                position: position || 'Unknown Position',
                source: headerInfo?.from?.text?.includes('linkedin.com') ? 'LinkedIn' : 'Indeed',
                applicationDate: email.date,
                subject: headerInfo?.subject || email.subject,
                rawEmail: textContent.substring(0, 1000)
            };
        } catch (error) {
            console.error('Error parsing email content:', error);
            return null;
        }
    }

    async disconnect() {
        if (this.connection) {
            await this.connection.end();
            console.log('Disconnected from email server');
        }
    }
}

module.exports = new EmailService(); 