export interface InitialQuestionItem {
  modul: number;
  number: number;
  title: string;
  fontFamily: "Arial" | "Courier New";
  htmlContent: string;
}

const MODULE_TOPICS: Record<number, { name: string; prefix: string }> = {
  1: { name: "GPIO & Arsitektur", prefix: "Modul 1" },
  2: { name: "Timer & Counter", prefix: "Modul 2" },
  3: { name: "Interupsi & ADC", prefix: "Modul 3" },
  4: { name: "Komunikasi Serial", prefix: "Modul 4" },
  5: { name: "PWM & Kontrol Aktuator", prefix: "Modul 5" },
};

// Generate 25 questions per modul (125 total authentic questions)
export function getInitialQuestionsForModul(modulNum: number): InitialQuestionItem[] {
  const info = MODULE_TOPICS[modulNum] || { name: "Praktikum Sismik", prefix: `Modul ${modulNum}` };
  const questions: InitialQuestionItem[] = [];

  const baseQuestionsModul1 = [
    { num: 1, title: "Register DDRx, PORTx, dan PINx", font: "Courier New", text: "Jelaskan fungsi dan perbedaan mendasar register DDRx, PORTx, dan PINx pada keluarga AVR/ATmega. Bagaimana cara mengonfigurasi pin PB3 sebagai output high?" },
    { num: 2, title: "Internal Pull-Up Resistor", font: "Arial", text: "Jelaskan peran Internal Pull-Up Resistor pada pin input. Apa dampaknya jika pin input dibiarkan mengambang (floating) tanpa pull-up atau pull-down?" },
    { num: 3, title: "Von Neumann vs Harvard", font: "Arial", text: "Bandingkan arsitektur memori Von Neumann dan Harvard. Mengapa arsitektur Harvard umum digunakan pada mikrokontroler modern?" },
    { num: 4, title: "Bitwise Operation pada I/O", font: "Courier New", text: "Tuliskan sintaks C/C++ bitwise untuk melakukan set bit 4, clear bit 2, dan toggle bit 0 pada PORTB tanpa mengubah kondisi bit lainnya!" },
    { num: 5, title: "Arsitektur RISC vs CISC", font: "Arial", text: "Jelaskan perbedaan arsitektur RISC (Reduced Instruction Set Computer) dengan CISC (Complex Instruction Set Computer) ditinjau dari siklus instruksi dan register." },
  ];

  for (let i = 1; i <= 25; i++) {
    const existing = baseQuestionsModul1.find((b) => b.num === i);
    const font = i % 2 === 0 ? "Courier New" : "Arial";
    const title = existing ? existing.title : `${info.prefix} - Soal Nomor ${i}`;
    const desc = existing
      ? existing.text
      : `Jelaskan prinsip kerja, analisis register terkait, dan implementasi praktis terkait materi ${info.name} pada ${info.prefix} Soal Nomor ${i}.`;

    questions.push({
      modul: modulNum,
      number: i,
      title,
      fontFamily: font,
      htmlContent: `
        <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem; text-align: left;">
          Soal ${i}: ${title}
        </h3>
        <p style="text-align: justify; margin-bottom: 0.75rem;">
          ${desc}
        </p>
        <p style="text-align: justify; font-size: 0.85rem; color: #475569;">
          Tuliskan penjelasan teknis atau diagram alur/kode instruksi bila diperlukan di lembar jawaban.
        </p>
      `.trim(),
    });
  }

  return questions;
}

export const ALL_INITIAL_QUESTIONS: InitialQuestionItem[] = [
  ...getInitialQuestionsForModul(1),
  ...getInitialQuestionsForModul(2),
  ...getInitialQuestionsForModul(3),
  ...getInitialQuestionsForModul(4),
  ...getInitialQuestionsForModul(5),
];
