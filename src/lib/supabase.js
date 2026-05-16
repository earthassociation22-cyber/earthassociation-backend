import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const uploadFile = async (fileBuffer, fileName, mimetype) => {
  const { data, error } = await supabase.storage
    .from('certificates') // Make sure this bucket exists and is public in Supabase
    .upload(fileName, fileBuffer, {
      contentType: mimetype,
      upsert: true,
    });

  if (error) {
    throw new Error('Failed to upload file to Supabase: ' + error.message);
  }

  const { data: publicData } = supabase.storage
    .from('certificates')
    .getPublicUrl(fileName);

  return publicData.publicUrl;
};
