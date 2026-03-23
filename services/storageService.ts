import { createClient } from '@supabase/supabase-js';
import { Patient } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Persistence will not work. Check .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

let patientsCache: Patient[] = [];

export const storageService = {
  loadData: async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('updatedAt', { ascending: false });

      if (error) throw error;
      patientsCache = data || [];
    } catch (err) {
      console.error('Failed to load data from Supabase:', err);
    }
  },

  getPatients: (): Patient[] => {
    return patientsCache;
  },

  savePatients: async (patients: Patient[]): Promise<void> => {
    try {
      const { error } = await supabase
        .from('patients')
        .upsert(patients);
      if (error) throw error;
      patientsCache = patients;
    } catch (err) {
      console.error('Failed to save patients to Supabase:', err);
    }
  },

  addPatient: async (patient: Patient): Promise<void> => {
    try {
      const { error } = await supabase
        .from('patients')
        .insert([patient]);

      if (error) throw error;
      patientsCache = [patient, ...patientsCache];
    } catch (err) {
      console.error('Failed to add patient to Supabase:', err);
    }
  },

  updatePatient: async (updatedPatient: Patient): Promise<void> => {
    try {
      const { error } = await supabase
        .from('patients')
        .update(updatedPatient)
        .eq('id', updatedPatient.id);

      if (error) throw error;

      const index = patientsCache.findIndex(p => p.id === updatedPatient.id);
      if (index !== -1) {
        patientsCache[index] = updatedPatient;
      }
    } catch (err) {
      console.error('Failed to update patient on Supabase:', err);
    }
  },

  deletePatient: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      patientsCache = patientsCache.filter(p => p.id !== id);
    } catch (err) {
      console.error('Failed to delete patient from Supabase:', err);
    }
  },

  getLogo: (): string | null => {
    return null;
  }
};
