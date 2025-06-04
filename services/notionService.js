const { Client } = require('@notionhq/client');

class NotionService {
    constructor() {
        this.notion = new Client({
            auth: process.env.NOTION_TOKEN,
        });
        this.databaseId = process.env.NOTION_DATABASE_ID;
    }

    async addApplication(application) {
        try {
            const response = await this.notion.pages.create({
                parent: {
                    database_id: this.databaseId,
                },
                properties: {
                    Name: {
                        title: [
                            {
                                text: {
                                    content: application.name,
                                },
                            },
                        ],
                    },
                    Email: {
                        email: application.email,
                    },
                    "Resume Link": {
                        url: application.resumeLink || null,
                    },
                    Source: {
                        select: {
                            name: application.source,
                        },
                    },
                    "Application Date": {
                        date: {
                            start: application.applicationDate.toISOString(),
                        },
                    },
                    Status: {
                        select: {
                            name: "New",
                        },
                    },
                },
            });

            console.log('Successfully added application to Notion:', application.name);
            return response;
        } catch (error) {
            console.error('Error adding application to Notion:', error);
            throw error;
        }
    }

    async checkIfApplicationExists(email) {
        try {
            const response = await this.notion.databases.query({
                database_id: this.databaseId,
                filter: {
                    property: "Email",
                    email: {
                        equals: email,
                    },
                },
            });

            return response.results.length > 0;
        } catch (error) {
            console.error('Error checking if application exists:', error);
            throw error;
        }
    }
}

module.exports = new NotionService(); 