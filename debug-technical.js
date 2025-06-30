// Debug script to test technical interview parsing
const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_TOKEN || 'ntn_q88942775343WsZKAfos9DYmAhODSKSPmPmc19L6Xhc7L1',
});

async function debugTechnicalInterview() {
  try {
    const applicationId = "21f21223-e79e-8091-979b-ef962a97eaed";
    console.log('Retrieving page data...');
    
    const response = await notion.pages.retrieve({ page_id: applicationId });
    const property = response.properties['Technical Interview'];
    
    if (property && property.rich_text && property.rich_text.length > 0) {
      let content = property.rich_text[0].text.content;
      console.log('Raw content length:', content.length);
      console.log('Raw content (first 500 chars):', content.substring(0, 500));
      console.log('Raw content (last 100 chars):', content.substring(content.length - 100));
      
      // Clean up content
      content = content.replace(/^```\n?/, '').replace(/\n?```$/, '').trim();
      console.log('\nCleaned content length:', content.length);
      console.log('Cleaned content (last 100 chars):', content.substring(content.length - 100));
      
      // Try to parse
      try {
        const parsed = JSON.parse(content);
        console.log('\n✅ Successfully parsed!');
        console.log('Questions count:', parsed.questions?.length || 0);
      } catch (parseError) {
        console.log('\n❌ Parse error:', parseError.message);
        
        // Try to fix truncated JSON
        if (content.includes('"resu') && !content.includes('"result"')) {
          content = content.replace(/,\s*"resu[^"]*$/, '');
          if (!content.includes('"result"')) {
            if (content.endsWith(']')) {
              content += ', "result": {"final_score": "", "comments": ""}';
            }
          }
        }
        
        // Ensure proper JSON closure
        let openBraces = (content.match(/{/g) || []).length;
        let closeBraces = (content.match(/}/g) || []).length;
        while (closeBraces < openBraces) {
          content += '}';
          closeBraces++;
        }
        
        console.log('Fixed content (last 100 chars):', content.substring(content.length - 100));
        
        try {
          const parsed = JSON.parse(content);
          console.log('\n✅ Successfully parsed after fix!');
          console.log('Questions count:', parsed.questions?.length || 0);
        } catch (finalError) {
          console.log('\n❌ Still failed after fix:', finalError.message);
        }
      }
    } else {
      console.log('No technical interview property found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugTechnicalInterview();
