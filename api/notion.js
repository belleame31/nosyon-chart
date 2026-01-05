// This file MUST be placed in a folder named /api/ in your project root
const { Client } = require("@notionhq/client");

export default async function handler(req, res) {
  // 1. Get parameters from the request
  const { id: databaseId, label: labelProp, value: valueProp } = req.query;
  
  // 2. Get the token from Vercel Environment Variables (Secure)
  const notionToken = process.env.NOTION_TOKEN;

  if (!notionToken) {
    return res.status(500).json({ error: "NOTION_TOKEN environment variable is not set on Vercel." });
  }

  if (!databaseId) {
    return res.status(400).json({ error: "Missing database ID parameter." });
  }

  const notion = new Client({ auth: notionToken });

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
    });

    // 3. Clean and format the data for Chart.js
    const results = response.results.map((page) => {
      const props = page.properties;
      
      // Attempt to find the label (Title or Rich Text)
      const label = props[labelProp]?.title?.[0]?.plain_text || 
                    props[labelProp]?.rich_text?.[0]?.plain_text || 
                    "Unknown";
      
      // Attempt to find the value (Number)
      const value = props[valueProp]?.number || 0;

      return { label, value };
    });

    // 4. Send the data back to your frontend
    return res.status(200).json(results);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}

