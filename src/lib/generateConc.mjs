// generateConcentrationUpdates.js

import { concentrations } from './constants.ts';

console.log('-- SQL Updates for Degree Program Concentrations');
console.log('-- Generated on:', new Date().toISOString());
console.log('');

// First, ensure columns exist
console.log('-- Add missing columns if they don\'t exist');
console.log('ALTER TABLE degree_programs ADD COLUMN IF NOT EXISTS concentrations JSONB DEFAULT \'[]\'::jsonb;');
console.log('ALTER TABLE degree_programs ADD COLUMN IF NOT EXISTS requires_concentration BOOLEAN DEFAULT false;');
console.log('');

// Generate updates for each program with concentrations
for (const [degreeCode, concentrationList] of Object.entries(concentrations)) {
  const hasConcentrations = concentrationList.length > 0;
  const jsonString = JSON.stringify(concentrationList).replace(/'/g, "''");
  
  console.log(`-- Update programs with degree code: ${degreeCode}`);
  console.log(`UPDATE degree_programs`);
  console.log(`SET`);
  console.log(`    concentrations = '${jsonString}'::jsonb,`);
  console.log(`    requires_concentration = ${hasConcentrations}`);
  console.log(`WHERE name LIKE '%${degreeCode}%'`);
  console.log(`OR name LIKE '%${degreeCode.substring(2)}%';`); // For matching without 'BS' prefix
  console.log('');
}

// Update College of Computing BS programs
console.log('-- Set requires_concentration for College of Computing BS programs');
console.log('UPDATE degree_programs');
console.log('SET requires_concentration = true');
console.log('WHERE college_id = 1'); // Assuming COC is ID 1
console.log('AND degree_type = \'BS\';');
console.log('');

// Verification query
console.log('-- Verify the updates');
console.log('SELECT');
console.log('    dp.id,');
console.log('    dp.name,');
console.log('    c.name as college_name,');
console.log('    dp.degree_type,');
console.log('    dp.requires_concentration,');
console.log('    jsonb_array_length(dp.concentrations) as num_concentrations');
console.log('FROM degree_programs dp');
console.log('LEFT JOIN colleges c ON dp.college_id = c.id');
console.log('WHERE dp.degree_type = \'BS\'');
console.log('ORDER BY c.name, dp.name;');