const API_KEY = "AIzaSyCgcvd37KilEX_pc5Dhkf4Cwsp_WNC1fFQ";

const resultsEl = document.getElementById('results');
const loader = document.getElementById('loader');
const loadMoreBtn = document.getElementById('loadMore');
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const playerModal = document.getElementById('playerModal');
const playerFrame = document.getElementById('playerFrame');
const closePlayer = document.getElementById('closePlayer');
const acceptTerms = document.getElementById('acceptTerms');
const declineTerms = document.getElementById('declineTerms');
const termsModal = document.getElementById('termsModal');

let nextPageToken = null;
let currentQuery = null;
let loading = false;

// Loader
function showLoader(){ loader.classList.remove('hidden'); }
function hideLoader(){ loader.classList.add('hidden'); }

// Create video card
function createCard(item){
  const id = item.id.videoId || item.id; // videoId for search, id for trending
  const thumb = item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || '';
  const title = item.snippet.title;
  const channel = item.snippet.channelTitle;
  
  const card = document.createElement('article');
  card.className = 'card';
  card.innerHTML = `
    <div class="thumb"><img src="${thumb}" loading="lazy" alt=""></div>
    <div class="meta">
      <h4>${title}</h4>
      <p>${channel}</p>
    </div>
  `;
  
  card.onclick = () => openPlayer(id);
  resultsEl.appendChild(card);
}

// Open video in modal
function openPlayer(id){
  playerFrame.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
  playerModal.classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
}

closePlayer.onclick = () => { playerFrame.src=''; playerModal.classList.remove('active'); }

// Fetch trending videos
async function fetchTrending(region='UA', append=false){
  if(loading) return;
  loading = true;
  showLoader();
  try{
    let url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=${region}&maxResults=40&key=${API_KEY}`;
    if(append && nextPageToken) url += `&pageToken=${nextPageToken}`;
    
    const res = await fetch(url);
    const data = await res.json();
    if(data.items && data.items.length){
      if(!append) resultsEl.innerHTML='';
      data.items.forEach(createCard);
      nextPageToken = data.nextPageToken || null;
    } else if(region !== 'RU') {
      await fetchTrending('RU', append);
    }
  } catch(e){
    console.error(e);
    if(region !== 'RU') await fetchTrending('RU', append);
  } finally{
    hideLoader();
    loading=false;
  }
}

// Search videos
async function searchVideos(query, append=false){
  if(loading) return;
  loading = true;
  showLoader();
  try{
    let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=40&q=${encodeURIComponent(query)}&key=${API_KEY}`;
    if(append && nextPageToken) url += `&pageToken=${nextPageToken}`;
    
    const res = await fetch(url);
    const data = await res.json();
    if(data.items && data.items.length){
      if(!append) resultsEl.innerHTML='';
      data.items.forEach(createCard);
      nextPageToken = data.nextPageToken || null;
    } else {
      await fetchTrending('UA', append);
    }
  } catch(e){
    console.error(e);
    await fetchTrending('UA', append);
  } finally{
    hideLoader();
    loading=false;
  }
}

// Terms modal
acceptTerms.onclick = () => { 
  termsModal.classList.remove('active'); 
  currentQuery=null; nextPageToken=null; fetchTrending('UA'); 
};
declineTerms.onclick = ()=>{ alert('Погодження необхідне для користування сайтом.'); };

// Load more
loadMoreBtn.onclick = ()=>{
  if(currentQuery){ searchVideos(currentQuery,true); }
  else fetchTrending('UA',true);
};

// Infinite scroll
window.addEventListener('scroll', ()=>{
  if((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 800) && !loading){
    if(nextPageToken){
      if(currentQuery) searchVideos(currentQuery,true);
      else fetchTrending('UA',true);
    }
  }
});

// Nav buttons
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item=>{
  item.addEventListener('click', ()=>{
    navItems.forEach(n=>n.classList.remove('active'));
    item.classList.add('active');
    const text = item.textContent.trim();
    if(text==='Тренди'){ currentQuery=null; nextPageToken=null; fetchTrending('UA'); }
    else if(text==='Музика'){ currentQuery='музика'; nextPageToken=null; searchVideos('музика'); }
    else if(text==='Підписки'){ currentQuery='підписки'; nextPageToken=null; searchVideos('підписки'); }
  });
});

// Search button + Enter
searchBtn.onclick = () => {
  const q = searchInput.value.trim();
  if(!q) return;
  currentQuery = q;
  nextPageToken = null;
  searchVideos(q);
};
searchInput.addEventListener('keyup', function(e){
  if(e.key==='Enter') searchBtn.click();
});

// Player modal background click
playerModal.addEventListener('click', function(e){
  if(e.target===playerModal){
    playerFrame.src='';
    playerModal.classList.remove('active');
  }
});

// Download button
document.getElementById('downloadBtn').onclick = ()=>{
  fetch('app/myapp.apk').then(r=>{
    if(!r.ok) throw new Error('no apk');
    return r.blob();
  }).then(b=>{
    const a=document.createElement('a');
    a.href=URL.createObjectURL(b);
    a.download='myapp.apk';
    a.click();
  }).catch(()=>alert('Покладіть ваш myapp.apk у папку /app на хостингу.'));
};

// Login
document.getElementById('loginBtn').onclick = ()=>{
  const name = prompt('Введіть ім\'я користувача:');
  if(!name) return;
  let users = JSON.parse(localStorage.getItem('yg_users')||'[]');
  if(!users.find(u=>u.name===name)){
    users.push({name, created: new Date().toISOString()});
    localStorage.setItem('yg_users', JSON.stringify(users));
    alert('Збережено локально.');
  } else alert('Ласкаво просимо назад, '+name);
};

// Hide loader at start
hideLoader();
