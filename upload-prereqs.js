/**
 * Script to upload prerequisites and postrequisites JSON to the database
 * 
 * Usage:
 * 1. Put your prerequisites JSON in a file called 'prerequisites.json'
 * 2. Put your postrequisites JSON in a file called 'postrequisites.json' 
 * 3. Run: node upload-prereqs.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function uploadPrereqsToAPI() {
    try {
        // Read JSON files
        let prerequisites = {};
        let postrequisites = {};

        const prereqPath = path.join(__dirname, 'prerequisites.json');
        const postreqPath = path.join(__dirname, 'postrequisites.json');

        if (fs.existsSync(prereqPath)) {
            prerequisites = JSON.parse(fs.readFileSync(prereqPath, 'utf8'));
            console.log(`📚 Loaded ${Object.keys(prerequisites).length} prerequisite entries`);
        }

        if (fs.existsSync(postreqPath)) {
            postrequisites = JSON.parse(fs.readFileSync(postreqPath, 'utf8'));
            console.log(`📋 Loaded ${Object.keys(postrequisites).length} postrequisite entries`);
        }

        if (Object.keys(prerequisites).length === 0 && Object.keys(postrequisites).length === 0) {
            console.error('❌ No data found. Create prerequisites.json and/or postrequisites.json files');
            return;
        }

        // Upload to API
        const apiUrl = 'http://localhost:3000/api/courses/upload-prereqs';
        
        console.log('🚀 Uploading to API...');
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prerequisites: Object.keys(prerequisites).length > 0 ? prerequisites : undefined,
                postrequisites: Object.keys(postrequisites).length > 0 ? postrequisites : undefined
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Upload successful!');
            console.log(`📊 Updated ${result.updatedCount} course entries`);
            
            if (result.errors && result.errors.length > 0) {
                console.log('⚠️  Some errors occurred:');
                result.errors.slice(0, 10).forEach(error => console.log(`  - ${error}`));
                if (result.errors.length > 10) {
                    console.log(`  ... and ${result.errors.length - 10} more errors`);
                }
            }
        } else {
            console.error('❌ Upload failed:', result.error);
        }

    } catch (error) {
        console.error('💥 Error:', error.message);
    }
}

// Example of how to structure your JSON files:
function createExampleFiles() {
    const examplePrereqs = {
        "ACCT 2101": [],
        "ACCT 2102": ["and", {"id": "ACCT 2101", "grade": "D"}],
        "AE 1601": ["or", {"id": "MATH 1501", "grade": "C"}, {"id": "MATH 1511", "grade": "C"}]
    };

    const examplePostreqs = {
        "MATH 1501": ["AE 1601", "CS 1371"],
        "ACCT 2101": ["ACCT 2102"]
    };

    if (!fs.existsSync('prerequisites.json')) {
        fs.writeFileSync('prerequisites-example.json', JSON.stringify(examplePrereqs, null, 2));
        console.log('📝 Created prerequisites-example.json');
    }

    if (!fs.existsSync('postrequisites.json')) {
        fs.writeFileSync('postrequisites-example.json', JSON.stringify(examplePostreqs, null, 2));
        console.log('📝 Created postrequisites-example.json');
    }
}

// Check if running as main script
if (import.meta.url === `file://${process.argv[1]}`) {
    if (process.argv.includes('--example')) {
        createExampleFiles();
    } else {
        uploadPrereqsToAPI();
    }
}

export { uploadPrereqsToAPI, createExampleFiles };