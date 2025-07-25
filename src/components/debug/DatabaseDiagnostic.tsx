"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { populateMissingPrograms } from '@/lib/populate-missing-programs';
import { supabase } from '@/lib/supabaseClient';

/**
 * Debug component to diagnose and fix database degree program issues
 * This can be temporarily added to any page to help fix the database
 */
export const DatabaseDiagnostic: React.FC = () => {
    const [status, setStatus] = useState<string>('');
    const [programs, setPrograms] = useState<any[]>([]);
    const [colleges, setColleges] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const checkDatabase = async () => {
        setLoading(true);
        setStatus('Checking database...');
        
        try {
            // Check colleges
            const { data: collegeData, error: collegeError } = await supabase
                .from('colleges')
                .select('*')
                .order('name');
                
            if (collegeError) {
                setStatus(`Error fetching colleges: ${collegeError.message}`);
                return;
            }
            
            setColleges(collegeData || []);
            
            // Check degree programs
            const { data: programData, error: programError } = await supabase
                .from('degree_programs')
                .select('*')
                .eq('is_active', true)
                .order('name');
                
            if (programError) {
                setStatus(`Error fetching degree programs: ${programError.message}`);
                return;
            }
            
            setPrograms(programData || []);
            setStatus(`Found ${collegeData?.length || 0} colleges and ${programData?.length || 0} degree programs`);
            
        } catch (error) {
            setStatus(`Exception: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    const populatePrograms = async () => {
        setLoading(true);
        setStatus('Populating missing programs...');
        
        try {
            await populateMissingPrograms();
            setStatus('Successfully populated missing programs!');
            // Refresh the data
            await checkDatabase();
        } catch (error) {
            setStatus(`Error populating programs: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="max-w-4xl mx-auto m-4">
            <CardHeader>
                <CardTitle>Database Diagnostic Tool</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Button onClick={checkDatabase} disabled={loading}>
                        Check Database
                    </Button>
                    <Button onClick={populatePrograms} disabled={loading} variant="outline">
                        Populate Missing Programs
                    </Button>
                </div>
                
                {status && (
                    <div className="p-3 bg-slate-100 rounded text-sm">
                        {status}
                    </div>
                )}
                
                {colleges.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-2">Colleges ({colleges.length})</h3>
                        <div className="flex flex-wrap gap-2">
                            {colleges.map(college => (
                                <Badge key={college.id} variant="secondary">
                                    {college.name} ({college.abbreviation})
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
                
                {programs.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-2">Degree Programs ({programs.length})</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                            {programs.map(program => (
                                <div key={program.id} className="text-sm p-2 border rounded">
                                    <div className="font-medium">{program.name}</div>
                                    <div className="text-slate-600">
                                        {program.degree_type} • {program.total_credits} credits
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="text-xs text-slate-500 mt-4">
                    <p><strong>Instructions:</strong></p>
                    <p>1. Click "Check Database" to see what's currently in the database</p>
                    <p>2. If "Aerospace Engineering" or other programs are missing, click "Populate Missing Programs"</p>
                    <p>3. Refresh the requirements page to test</p>
                </div>
            </CardContent>
        </Card>
    );
};