export const formatNumber = (num) => {
  if (num === null || num === undefined) return "";
  return Number(num).toLocaleString();
};

export const capitalizeWords = (text) => {
  if (!text) return text;

  return text
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const displayBrand = (brand) => {
  if (!brand || brand.trim() === "") return "No Brand";
  return capitalizeWords(brand);
};
