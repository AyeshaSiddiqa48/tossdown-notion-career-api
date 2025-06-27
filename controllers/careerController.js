const { Client } = require("@notionhq/client");
const axios = require("axios");

// Initialize Notion client
const notion = new Client({
  auth:
    process.env.NOTION_TOKEN ||
    "ntn_q88942775343WsZKAfos9DYmAhODSKSPmPmc19L6Xhc7L1",
});

// Application database ID (different from jobs database)
const applicationDatabaseId =
  process.env.APPLICATION_DATABASE_ID || "1d921223-e79e-8164-8cd4-fa013f4dd093";

// Submit job application to Notion
exports.submitApplication = async (req, res) => {
  try {
    // Extract data from request body
    const {
      fullname,
      phone,
      email,
      position,
      currentsalary,
      expectedsalary,
      experience,
      linkedInprofile,
      resume,
      noticeperiod,
      hr_interview,
      technical_interview,
      final_interview,
    } = req.body;

    // Validate required fields
    if (!fullname || !email || !position) {
      return res.status(400).json({
        success: false,
        message:
          "Required fields missing. Please provide at least fullname, email, and position.",
      });
    }

    // Prepare data for Notion API
    const data = {
      parent: { database_id: applicationDatabaseId },
      properties: {
        "Full Name": {
          title: [{ text: { content: fullname } }],
        },
        "Phone Number": {
          phone_number: phone || "",
        },
        "Email Address": {
          email: email,
        },
        Position: {
          rich_text: [{ text: { content: position } }],
        },
        "Current Salary": {
          rich_text: [{ text: { content: currentsalary || "" } }],
        },
        "Expected Salary": {
          rich_text: [{ text: { content: expectedsalary || "" } }],
        },
        "Years of Experience": {
          rich_text: [{ text: { content: experience || "" } }],
        },
        "LinkedIn Profile": {
          url: linkedInprofile || null,
        },
        "Resume File": {
          url: resume || null,
        },
        "Notice Period": {
          rich_text: [{ text: { content: noticeperiod || "" } }],
        },
        "HR Interview": {
          rich_text: [{ text: { content: hr_interview || "" } }],
        },
        "Technical Interview": {
          rich_text: [{ text: { content: technical_interview || "" } }],
        },
        "Final Interview": {
          rich_text: [{ text: { content: final_interview || "" } }],
        },
        
      },
    };

    // Submit to Notion API
    const response = await notion.pages.create(data);

    // Check if successful
    if (response && response.id) {
      return res.status(201).json({
        success: true,
        message: "Application submitted successfully",
        data: { id: response.id },
      });
    } else {
      throw new Error("Failed to create page in Notion");
    }
  } catch (error) {
    console.error("Error submitting application:", error);

    // Try fallback with axios if notion client fails
    if (error.message.includes("Failed to create page")) {
      try {
        const url = "https://api.notion.com/v1/pages";
        const headers = {
          Authorization: `Bearer ${
            process.env.NOTION_TOKEN ||
            "ntn_q88942775343WsZKAfos9DYmAhODSKSPmPmc19L6Xhc7L1"
          }`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        };

        // Extract data from request body
        const {
          fullname,
          phone,
          email,
          position,
          currentsalary,
          expectedsalary,
          experience,
          linkedInprofile,
          resume,
          noticeperiod,
          hr_interview,
          technical_interview,
          final_interview,
        } = req.body;

        // Prepare data for Notion API
        const data = {
          parent: { database_id: applicationDatabaseId },
          properties: {
            "Full Name": {
              title: [{ text: { content: fullname } }],
            },
            "Phone Number": {
              phone_number: phone || "",
            },
            "Email Address": {
              email: email,
            },
            Position: {
              rich_text: [{ text: { content: position } }],
            },
            "Current Salary": {
              rich_text: [{ text: { content: currentsalary || "" } }],
            },
            "Expected Salary": {
              rich_text: [{ text: { content: expectedsalary || "" } }],
            },
            "Years of Experience": {
              rich_text: [{ text: { content: experience || "" } }],
            },
            "LinkedIn Profile": {
              url: linkedInprofile || null,
            },
            "Resume File": {
              url: resume || null,
            },
            "Notice Period": {
              rich_text: [{ text: { content: noticeperiod || "" } }],
            },
             "HR Interview": {
          rich_text: [{ text: { content: hr_interview || "" } }],
        },
        "Technical Interview": {
          rich_text: [{ text: { content: technical_interview || "" } }],
        },
        "Final Interview": {
          rich_text: [{ text: { content: final_interview || "" } }],
        },
        
          },
        };

        const axiosResponse = await axios.post(url, data, { headers });

        if (axiosResponse.data && axiosResponse.data.id) {
          return res.status(201).json({
            success: true,
            message: "Application submitted successfully",
            data: { id: axiosResponse.data.id },
          });
        }
      } catch (axiosError) {
        console.error("Axios fallback error:", axiosError);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to submit application",
      error: error.message,
    });
  }
};

// controllers/careerController.js

exports.updateApplicationStatus = async (req, res) => {
  const { pageId, status } = req.body;

  if (!pageId || !status) {
    return res.status(400).json({
      success: false,
      message: "Both pageId and status are required.",
    });
  }

  

  try {
    const response = await notion.pages.update({
      page_id: pageId,
     properties: {
    "Status": {
      select: {
        name: status
      }
    }
  }
    });

    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: response,
    });
  } catch (error) {
    console.error("Error updating status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update status",
      error: error.message,
    });
  }
};



exports.debugDatabaseProperties = async (req, res) => {
  try {
    const db = await notion.databases.retrieve({
      database_id: applicationDatabaseId,
    });

    // Log the full schema in console (for deep inspection)
    console.log("🔍 Full Notion DB Properties:", JSON.stringify(db.properties, null, 2));

    // Prepare a simplified version to return in response
    const simplified = {};
    for (const key in db.properties) {
      simplified[key] = {
        type: db.properties[key].type,
        id: db.properties[key].id
      };
    }

    return res.status(200).json({
      success: true,
      message: "Database properties fetched successfully",
      properties: simplified
    });
  } catch (error) {
    console.error("❌ Error fetching Notion DB schema:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch database schema",
      error: error.message
    });
  }
};
