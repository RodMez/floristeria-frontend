import jsPDF from "jspdf";

export async function loadCinzelFonts(doc: jsPDF): Promise<boolean> {
  try {
    const weights = [
      { file: "Cinzel-Regular.ttf", style: "normal" as const },
      { file: "Cinzel-Bold.ttf", style: "bold" as const },
    ];
    await Promise.all(
      weights.map(async ({ file, style }) => {
        const res = await fetch(`/fonts/${file}`);
        if (!res.ok) throw new Error(`Font ${file} not found`);
        const buffer = await res.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        doc.addFileToVFS(file, btoa(binary));
        doc.addFont(file, "Cinzel", style);
      })
    );
    return true;
  } catch {
    return false;
  }
}
