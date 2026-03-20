

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const universal = {
  "ssr": false,
  "prerender": false
};
export const universal_id = "src/web/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.CglhwUqr.js","_app/immutable/chunks/Bdz3af75.js","_app/immutable/chunks/FyVmiF2v.js","_app/immutable/chunks/BzFtKHj8.js","_app/immutable/chunks/CqicoTqI.js","_app/immutable/chunks/PNpiLyhe.js","_app/immutable/chunks/BMRk7WTg.js","_app/immutable/chunks/BM-G8IID.js","_app/immutable/chunks/Bu28GzQA.js","_app/immutable/chunks/qLexADvl.js","_app/immutable/chunks/mDq2gDjt.js","_app/immutable/chunks/BsbqSXd_.js","_app/immutable/chunks/B3mtjhtA.js","_app/immutable/chunks/71YLn20Y.js","_app/immutable/chunks/F1pcsv38.js","_app/immutable/chunks/BbRkrmOR.js"];
export const stylesheets = ["_app/immutable/assets/0.BvhhMA7J.css"];
export const fonts = [];
