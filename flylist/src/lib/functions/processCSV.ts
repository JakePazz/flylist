import Papa from "papaparse";

export async function processCSV<T>({
  url,
  message,
  transformFunction,
  saveFunction,
  setProgress,
  updateMessage,
  hasHeaders = true
}: {
  url: string;
  message: string;
  transformFunction: (row: Record<string, unknown>) => T;
  saveFunction: (items: T[]) => Promise<void>;
  setProgress: (percentage: number) => void;
  updateMessage: (msg: string) => void;
  hasHeaders?: boolean;
}): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    updateMessage(message);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    
    const csvData = await response.text();
    if (!csvData) {
      throw new Error(`Failed to fetch data: CSV data not found`);
    }
    
    let hasParsingError = false;
    let totalProcessedItems = 0;
    const estimatedRecords = (csvData.match(/\n/g) || []).length;
    updateMessage(`Processing... (0/${estimatedRecords} expected)`);

    await new Promise<void>((resolve, reject) => {
      Papa.parse(csvData, {
        header: hasHeaders,
        dynamicTyping: true,
        skipEmptyLines: true,
        chunkSize: 5000,
        chunk: async function(results: Papa.ParseResult<Record<string, unknown>>, parser: Papa.Parser) {
          try {
            parser.pause();
            
            // Filter valid items only
            const validItems: T[] = [];
            for (const row of results.data) {
              try {
                const item = transformFunction(row as Record<string, unknown>);
                validItems.push(item);
              } catch (err) {
                console.warn("Skipping invalid data:", err);
              }
            }

            totalProcessedItems += validItems.length;
            setProgress(Math.round((totalProcessedItems / estimatedRecords) * 100));

            // Process in smaller sub-batches
            const subBatchSize = 100;
            for (let i = 0; i < validItems.length; i += subBatchSize) {
              const subBatch = validItems.slice(i, i + subBatchSize);
              await saveFunction(subBatch);
              
              // Prevent queue overflow
              await new Promise(r => setTimeout(r, 50));
            }
            
            await new Promise(r => setTimeout(r, 100));
            parser.resume();
          } catch (error) {
            hasParsingError = true;
            parser.abort();
            reject(error);
          }
        },
        complete: function() {
          if (!hasParsingError) {
            resolve();
          }
        },
        error: function(error: Error) {
          hasParsingError = true;
          reject(error);
        }
      });
    });
    
    return { success: true, count: totalProcessedItems };
  } catch (error) {
    return { success: false, count: 0, error: String(error) };
  }
}