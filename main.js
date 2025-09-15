const clock = document.getElementById('clock');
const date = document.getElementById('date');
const ascii_content = document.getElementById('ascii-content');
const ascii_title = document.getElementById('ascii-title');
const book_cont = document.getElementById('bookmark-content');
const search_input = document.getElementById('search-input');
const search_text = document.getElementById('search-text');

const getRandomAscii = () => { return ASCII_ARRAY[Math.floor(Math.random()*ASCII_ARRAY.length)]; };

const setAscii = () => {
  let ascii = getRandomAscii();
  if (!CONFIG.enable_lewd && ascii.lewd) {
    console.log(`Lewd skipped: ${ascii.name}`);
    return setAscii(); // loop until a non lewd one is chosen
  }
  ascii_title.innerHTML = ascii.name;
  if (ascii.type == ASCII_BASIC) {
    ascii_content.innerHTML = `<span class="aa">${ascii.text}</span>`;
  } else if (ascii.type == ASCII_2CH) {
    let parsed_aa = ascii.text.replaceAll('>', "&gt;").replaceAll('<', "&lt;");
    ascii_content.innerHTML = `<pre class="aa">${parsed_aa}</pre>`
  }
};

const setDate = () => {
  const now = new Date();
  const secs = now.getSeconds().toString().padStart(2, '0');
  const mins = now.getMinutes().toString().padStart(2, '0');
  const hour = now.getHours().toString().padStart(2, '0');
  clock.innerHTML = `${hour}:${mins}:${secs}`

  date.innerHTML = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).toLowerCase();
};

const populateBookmarks = () => {
  let bookmark_html = "";
  BOOKMARKS.forEach((mark) => {
    let name = mark.name;
    let url = mark.url;
    bookmark_html += `<div><a href=${url}><span>&gt; ${name}</span></a></div>`
  });
  book_cont.innerHTML = bookmark_html;
};

const parseQuery = (raw_query) => {
  // https://github.com/xvvvyz/tilde
  const isUrl = (s) => {
    return /^((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)$/i.test(s);
  };
  const hasProtocol = (s) => {
    return /^[a-zA-Z]+:\/\//i.test(s);
  }
  const query = raw_query.trim();
  if (isUrl(query)) {
    const url = hasProtocol(query) ? query : `https://${query}`;
    return {url, query, name: "Url"};
  }
  if (COMMANDS.has(query)) {
    const cmd = COMMANDS.get(query);
    return {url: cmd.url, query: "", name: cmd.name};
  }

  let split = CONFIG.cmd_search;
  const [search_key, raw_search] = query.split(new RegExp(`${split}(.*)`));
  if (COMMANDS.has(search_key)) {
    const cmd = COMMANDS.get(search_key);
    const templ = new URL(cmd.templ ?? '', cmd.url);
    const search = raw_search.trim();
    const url = decodeURI(templ.href).replace(/{}/g, encodeURIComponent(search));
    return {url, query: search, name: cmd.name};
  }

  split = CONFIG.cmd_path;
  const [path_key, path] = query.split(new RegExp(`${split}(.*)`));
  if (COMMANDS.has(path_key)) {
    const cmd = COMMANDS.get(path_key);
    let pathed_path = path.replaceAll(" ", "/");
    const url = `${new URL(cmd.url)}/${pathed_path}`.replaceAll("//", "/");
    return {url, query: pathed_path, name: cmd.name};
  }

  const cmd = COMMANDS.get(CONFIG.def_search);
  const templ = new URL(cmd.templ ?? '', cmd.url);
  const url = decodeURI(templ.href).replace(/{}/g, encodeURIComponent(query));
  return {url, query, name: cmd.name};
};
const base_search = COMMANDS.get(CONFIG.def_search).name;
search_text.innerHTML = base_search;
search_input.addEventListener("input", async (ev) => {
  const val = search_input.value;
  if (val !== "") {
    const {url, query, name} = parseQuery(val);
    search_text.innerHTML = `${name}`;
  } else {
    search_text.innerHTML = base_search;
  }
});
search_input.addEventListener("keypress", async (ev) => {
  const val = search_input.value;
  if (ev.key == "Enter" || ev.keycode == 13) {
    const target = ev.ctrlKey ? '_blank' : "_self";
    const {url, query, name} = parseQuery(val);
    window.open(url, target, "noopener nonreferrer");
    search_input.value = "";
    search_text.innerHTML = base_search;
  }
});
search_input.focus();

setInterval(setDate, 1000);
setDate();
setAscii();
populateBookmarks();
