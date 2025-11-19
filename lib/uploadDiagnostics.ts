// Simple diagnostics utility for tracking upload issues
export class UploadDiagnostics {
  private static readonly STORAGE_KEY = 'empi_upload_diagnostics';
  private static readonly MAX_ENTRIES = 50;

  /**
   * Log a diagnostic event
   */
  static logEvent(stage: string, data: any): void {
    try {
      const entry = {
        timestamp: new Date().toISOString(),
        stage,
        data,
      };

      console.log(`📊 [${stage}]`, data);

      // Store in localStorage
      const existing = this.getAll();
      existing.push(entry);
      const trimmed = existing.slice(-this.MAX_ENTRIES);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
    } catch (err) {
      console.warn('Diagnostics storage failed:', err);
    }
  }

  /**
   * Get all diagnostic events
   */
  static getAll(): any[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clear all diagnostics
   */
  static clear(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  /**
   * Get diagnostics for a specific stage
   */
  static getByStage(stage: string): any[] {
    return this.getAll().filter((e) => e.stage === stage);
  }

  /**
   * Print diagnostics summary to console
   */
  static printSummary(): void {
    const all = this.getAll();
    console.table(all);
    
    console.log(`\n📊 Total Events: ${all.length}`);
    const stages = new Set(all.map((e) => e.stage));
    console.log(`Stages tracked: ${Array.from(stages).join(', ')}`);
    
    const failures = all.filter((e) => e.stage.includes('error') || e.data?.error);
    if (failures.length > 0) {
      console.log(`\n❌ Failed events: ${failures.length}`);
      console.table(failures);
    }
  }
}
