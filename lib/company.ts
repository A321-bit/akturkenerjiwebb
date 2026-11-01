// Şirketin yasal bilgileri (6563 sayılı Kanun m.3 ve mesafeli satış metinleri). Boş alan sitede gösterilmez.
export const LEGAL_NAME = "Akturk Yenilenebilir Enerji Teknolojileri San. Tic. Ltd. Şti.";

const REGISTRY = {
  mersis: "",
  vergiDairesi: "",
  vergiNo: "",
  ticaretSicil: "",
  etbis: "",
};

export const companyRegistry = [
  { label: "MERSİS No", value: REGISTRY.mersis },
  { label: "Vergi Dairesi", value: REGISTRY.vergiDairesi },
  { label: "Vergi No", value: REGISTRY.vergiNo },
  { label: "Ticaret Sicil No", value: REGISTRY.ticaretSicil },
  { label: "ETBİS Kayıt No", value: REGISTRY.etbis },
].filter((x) => x.value);
