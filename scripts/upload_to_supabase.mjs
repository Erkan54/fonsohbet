import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env file
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const cachePath = path.resolve(process.cwd(), 'data', 'fund_prices_cache.json');
  if (!fs.existsSync(cachePath)) {
    console.error("Cache file not found:", cachePath);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  console.log(`Found ${rawData.length} records in cache.`);

  const CHUNK_SIZE = 1000;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < rawData.length; i += CHUNK_SIZE) {
    const chunk = rawData.slice(i, i + CHUNK_SIZE);
    
    // We only need fund_code, date, price
    const mappedChunk = chunk.map(r => ({
      fund_code: r.fund_code,
      date: r.date,
      price: Number(r.price)
    }));

    const { error } = await supabase
      .from('fund_prices')
      .upsert(mappedChunk, { onConflict: 'fund_code,date', ignoreDuplicates: true });

    if (error) {
      console.error(`Error uploading chunk ${i} to ${i + CHUNK_SIZE}:`, error.message);
      errorCount++;
    } else {
      successCount += chunk.length;
      console.log(`Successfully uploaded ${successCount} / ${rawData.length} records...`);
    }
  }

  console.log("Upload complete.");
  console.log(`Success: ${successCount}`);
  if (errorCount > 0) console.log(`Errors: ${errorCount}`);
}

main();
