const { BigQuery } = require('@google-cloud/bigquery');

async function testConnection() {
  try {
    const credsBase64 = process.env.BIGQUERY_CREDENTIALS_BASE64;
    
    if (!credsBase64) {
      console.error('❌ BIGQUERY_CREDENTIALS_BASE64 not set');
      return;
    }

    const credentials = JSON.parse(
      Buffer.from(credsBase64, 'base64').toString('utf-8')
    );

    console.log('✓ Credentials decoded');
    console.log('  Service Account:', credentials.client_email);

    const bigquery = new BigQuery({
      projectId: 'amazon-ppc-474902',
      credentials: credentials,
      location: 'US',
    });

    console.log('\nTesting BigQuery connection...');

    // Test query
    const query = `
      SELECT 
        COUNT(*) as total_keywords,
        COUNT(DISTINCT campaign_id) as total_campaigns
      FROM \`amazon-ppc-474902.amazon_ppc_data.keywords\`
      LIMIT 1
    `;

    const [rows] = await bigquery.query({ query, location: 'US' });
    
    console.log('\n✅ BigQuery connection successful!');
    console.log('   Total Keywords:', rows[0].total_keywords);
    console.log('   Total Campaigns:', rows[0].total_campaigns);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.errors) {
      console.error('   Details:', error.errors);
    }
  }
}

testConnection();
