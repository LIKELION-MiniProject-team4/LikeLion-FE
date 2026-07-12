let isLoggedIn = false;
let isCertified = false;
let userPoints = 0;
let userName = '을지유저';
let userStudentId = '';
let bookmarkedIds = [1];
let currentProfId = 1;
let currentMode = 'search';
let selectedRating = 5;
let purchasedJokbo = [];

const professorsData = [
  {
    id: 1,
    name: '김을지 교수님',
    college: '보건과학대학',
    dept: '물리치료학과',
    rating: 4.6,
    reviewCount: 128,
    grade: '1',
    tags: ['설명 친절', '과제 적당', '시험 난이도 중'],
    subjects: ['온열치방학', '재활운동학'],
    allTags: [
      { name: '설명 친절', count: 68, max: 80 },
      { name: '과제 적당', count: 54, max: 80 },
      { name: '시험 난이도 중', count: 49, max: 80 },
    ],
    reviews: [
      {
        id: 101,
        writer: '익명 수강생',
        rating: 5,
        semester: '2026-1',
        text: '교수님께서 출제 범위를 명확하게 잡아주셔서 대비하기 매우 수월했습니다.',
        date: '2026.06.14',
        timestamp: new Date('2026-06-14').getTime(),
      },
      {
        id: 102,
        writer: '익명 수강생',
        rating: 4,
        semester: '2025-2',
        text: '과제 양은 적절하지만 실습 비중이 다소 있는 편입니다.',
        date: '2025.12.20',
        timestamp: new Date('2025-12-20').getTime(),
      },
    ],
  },
  {
    id: 2,
    name: '박라운지 교수님',
    college: '보건과학대학',
    dept: '임상병리학과',
    rating: 4.2,
    reviewCount: 12,
    grade: '2',
    tags: ['학점 후함', '널널한 과제'],
    subjects: ['기초임상학', '실습'],
    allTags: [{ name: '학점 후함', count: 30, max: 50 }],
    reviews: [],
  },
];

const jokboStoreData = [
  {
    id: 501,
    profName: '김을지 교수님',
    subject: '온열치방학',
    type: '2025년 중간고사 기출',
    price: 200,
  },
];

// 이중 권한 시스템 UI 제어 업데이트 (비로그인 시 열람은 허용하되 작성창만 Lock)
function updateAuthUI() {
  const noticeMsg = document.getElementById('tag-notice-msg');
  const writeLockOverlay = document.getElementById('review-write-lock-overlay');
  const reviewLockMsg = document.getElementById('review-lock-msg');

  if (isLoggedIn) {
    document.getElementById('profile-logged-out').classList.add('hidden');
    document.getElementById('profile-logged-in').classList.remove('hidden');
    document.getElementById('header-auth-zone').innerHTML =
      `<button class="login-btn" id="btn-logout"><span class="material-icons-outlined">logout</span> 로그아웃</button>`;

    document.getElementById('diagram-lock-overlay').classList.add('hidden');
    document.getElementById('mypage-lock-overlay').classList.add('hidden');
    document.getElementById('mypage-content').classList.remove('hidden');

    document.getElementById('user-points').innerText = userPoints;
    document.getElementById('mypage-points').innerText = userPoints;
    document.getElementById('sidebar-user-name').innerText = userName;
    document.getElementById('sidebar-avatar-name').innerText =
      userName.substring(0, 2);
    document.getElementById('mypage-user-display').innerText =
      `${userName} (${userStudentId || '학번인증 전'})`;

    if (noticeMsg)
      noticeMsg.innerText =
        '교수님에 맞는 태그를 선택하여 등록해 보세요. (+2P)';

    // 리뷰 글쓰기는 로그인 완료 + 학생 수강확인서 인증 스위치까지 켜져야 오버레이 해제
    if (isCertified) {
      writeLockOverlay.classList.add('hidden');
    } else {
      writeLockOverlay.classList.remove('hidden');
      reviewLockMsg.innerHTML =
        '🔒 <strong>마이페이지</strong>에서 [수강확인서 파일]을 인증 완료해야 후기 작성이 가능합니다.';
    }
    renderPurchasedJokboList();
  } else {
    document.getElementById('profile-logged-out').classList.remove('hidden');
    document.getElementById('profile-logged-in').classList.add('hidden');
    document.getElementById('header-auth-zone').innerHTML =
      `<button class="login-btn" id="btn-top-login-trigger"><span class="material-icons-outlined">login</span> 로그인</button>`;

    writeLockOverlay.classList.remove('hidden');
    reviewLockMsg.innerText =
      '🔒 리뷰 작성은 로그인 및 수강확인서 인증이 필요합니다.';

    document.getElementById('diagram-lock-overlay').classList.remove('hidden');
    document.getElementById('mypage-lock-overlay').classList.remove('hidden');
    document.getElementById('mypage-content').classList.add('hidden');
    if (noticeMsg) noticeMsg.innerText = '태그 입력은 로그인이 필요합니다.';
  }
}

// 오버레이 클릭 시 유도 액션
document
  .getElementById('btn-review-action-trigger')
  .addEventListener('click', () => {
    if (!isLoggedIn) openAuthModal('login');
    else
      switchView(
        document.getElementById('view-mypage'),
        document.getElementById('menu-mypage'),
      );
  });

// 파일 수강확인서 인증 트리거
document
  .getElementById('verification-file-input')
  .addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      isCertified = true;
      document.getElementById('file-name-display').innerText =
        `✅ 수강인증 완료 (${file.name})`;
      document.getElementById('file-name-display').style.color = '#2b8a3e';
      alert(
        '🎉 학생 수강인증이 정상 확인되었습니다. 이제 클린리뷰 등록 권한이 활성화됩니다.',
      );
      updateAuthUI();
    }
  });

// 리뷰 무조건 익명으로 데이터 주입 및 보상 처리 (+3P)
document.getElementById('btn-submit-review').addEventListener('click', () => {
  const textInput = document.getElementById('input-review-text');
  const prof = professorsData.find((p) => p.id === currentProfId);

  if (textInput.value.trim().length < 10) {
    alert('성의있는 후기 평가를 10자 이상 작성해 주세요.');
    return;
  }

  const now = new Date();
  const timeString = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

  // 요구사항: 무조건 고정값 '익명 수강생' 주입
  prof.reviews.unshift({
    id: Date.now(),
    writer: '익명 수강생',
    rating: selectedRating,
    semester: document.getElementById('input-semester').value,
    text: textInput.value,
    date: timeString,
    timestamp: now.getTime(),
  });

  prof.reviewCount += 1;
  userPoints += 3;
  textInput.value = '';
  alert('📝 클린 익명 리뷰가 게시되었습니다. 3포인트가 적립되었습니다.');
  updateAuthUI();
  sortAndRenderReviews();
});

// 확장된 다중 필터 기능이 실시간 연동되는 검색 엔진 리스트 렌더러
function renderProfessorList() {
  const homeProfList = document.getElementById('home-prof-list');
  const query = document
    .getElementById('home-search-input')
    .value.toLowerCase();

  const filterDept = document.getElementById('filter-dept').value;
  const filterGrade = document.getElementById('filter-grade').value;

  homeProfList.innerHTML = '';
  let data =
    currentMode === 'bookmark'
      ? professorsData.filter((p) => bookmarkedIds.includes(p.id))
      : professorsData;

  // 조건 필터링 검사 체계
  data = data.filter((p) => {
    const matchQuery =
      p.name.toLowerCase().includes(query) ||
      p.dept.toLowerCase().includes(query);
    const matchDept = filterDept === 'all' || p.dept === filterDept;
    const matchGrade = filterGrade === 'all' || p.grade === filterGrade;
    return matchQuery && matchDept && matchGrade;
  });

  if (data.length === 0) {
    homeProfList.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-muted); font-size:13px;">필터 조건에 부합하는 교수님 정보가 존재하지 않습니다.</div>`;
    return;
  }

  data.forEach((prof) => {
    const isBookmarked = bookmarkedIds.includes(prof.id);
    const card = document.createElement('div');
    card.className = 'prof-card';
    card.innerHTML = `
      <div class="prof-card-left">
        <div class="prof-avatar-large"><span class="material-icons-outlined">account_circle</span></div>
        <div class="prof-info-block">
          <h3>${prof.name}</h3>
          <div class="dept-text">${prof.college} ${prof.dept} · [${prof.grade}학년 대상]</div>
          <div class="card-tags">${prof.tags.map((t) => `<span class="tag-badge">${t}</span>`).join('')}</div>
          <div class="card-rating"><span class="material-icons-outlined">star</span> ${prof.rating.toFixed(1)} (${prof.reviewCount}개 리뷰)</div>
        </div>
      </div>
      <div class="prof-card-right">
        <button class="bookmark-btn ${isBookmarked ? 'active' : ''}" data-id="${prof.id}">
          <span class="material-icons-outlined">${isBookmarked ? 'bookmark' : 'bookmark_border'}</span>
        </button>
        <button class="detail-view-btn" data-id="${prof.id}">자세히 보기</button>
      </div>
    `;
    homeProfList.appendChild(card);
  });
}

// 리뷰 피드 렌더러
function sortAndRenderReviews() {
  const prof = professorsData.find((p) => p.id === currentProfId);
  const sortValue = document.getElementById('review-sort').value;
  let sorted = [...prof.reviews];
  if (sortValue === 'latest') sorted.sort((a, b) => b.timestamp - a.timestamp);
  else if (sortValue === 'rating') sorted.sort((a, b) => b.rating - a.rating);

  document.getElementById('review-list-container').innerHTML = sorted
    .map(
      (rev) => `
    <div class="review-clean-node">
      <div class="node-top">
        <div class="node-user-info">
          <span class="material-icons-outlined" style="font-size:16px;">lock_person</span>
          <span>${rev.writer}</span>
          <div class="node-stars">${`★`.repeat(rev.rating)}${`☆`.repeat(5 - rev.rating)}</div>
        </div>
        <div class="node-meta">
          <span>${rev.semester} 수강</span>
          <span>${rev.date}</span>
        </div>
      </div>
      <p class="node-text">${rev.text}</p>
    </div>
  `,
    )
    .join('');
}

// 개편된 회원가입 폼 제출 이벤트 바인딩
document
  .getElementById('btn-execute-register')
  .addEventListener('click', () => {
    const email = document.getElementById('reg-email').value;
    const name = document.getElementById('reg-name').value;
    const studentId = document.getElementById('reg-student-id').value;

    if (!email || !name || !studentId) {
      alert('모든 회원가입 필수정보 및 학번인증 란을 기입해 주세요.');
      return;
    }

    userName = name;
    userStudentId = studentId;
    userPoints = 20; // 가입 즉시 20P 적립 조건 유지
    isLoggedIn = true;
    document.getElementById('auth-modal').classList.add('hidden');
    alert(
      `🎁 강의라운지 가입을 환영합니다, ${userName}님! 신규 회원가입 20포인트가 자동 적립되었습니다.`,
    );
    updateAuthUI();
  });

// 태그 보상 처리 연동 (+2P)
document
  .getElementById('btn-tag-input-trigger')
  .addEventListener('click', () => {
    if (!isLoggedIn) {
      alert('태그 기여는 로그인이 필요합니다.');
      openAuthModal('login');
      return;
    }
    userPoints += 2;
    alert('🏷️ 태그 기여 완료! 2포인트가 실시간 적립되었습니다.');
    updateAuthUI();
  });

function openAuthModal(mode = 'login') {
  const authModal = document.getElementById('auth-modal');
  authModal.classList.remove('hidden');
  if (mode === 'login') {
    document.getElementById('modal-sub-login').classList.remove('hidden');
    document.getElementById('modal-sub-register').classList.add('hidden');
  } else {
    document.getElementById('modal-sub-login').classList.add('hidden');
    document.getElementById('modal-sub-register').classList.remove('hidden');
  }
}

function renderDetailPage(profId) {
  const prof = professorsData.find((p) => p.id === Number(profId));
  if (!prof) return;
  currentProfId = prof.id;

  document.querySelector('.current-dept').innerText = prof.dept;
  document.getElementById('detail-prof-name').innerText = prof.name;
  document.getElementById('detail-prof-dept').innerText =
    `${prof.college} ${prof.dept}`;
  document.getElementById('detail-subjects').innerText =
    prof.subjects.join(', ');
  document.getElementById('detail-score').innerText = prof.rating.toFixed(1);
  document.getElementById('detail-review-count').innerText =
    `${prof.reviewCount}개 리뷰 기준`;

  document.getElementById('detail-top-tags').innerHTML = prof.allTags
    .slice(0, 3)
    .map(
      (t, i) =>
        `<div class="top-tag-item"><span class="num-badge">${i + 1}</span> ${t.name}</div>`,
    )
    .join('');

  document.getElementById('tag-progress-container').innerHTML = prof.allTags
    .map(
      (t) => `
    <div class="progress-card">
      <div class="progress-header">
        <span class="tag-name">${t.name}</span>
        <span class="count-badge">${t.count}</span>
      </div>
      <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${(t.count / t.max) * 100}%"></div></div>
    </div>
  `,
    )
    .join('');

  sortAndRenderReviews();
}

function renderJokboStore() {
  const container = document.getElementById('jokbo-list-container');
  container.innerHTML = jokboStoreData
    .map((item) => {
      const isOwned = purchasedJokbo.some((p) => p.id === item.id);
      return `
      <div class="jokbo-card">
        <div>
          <span class="jokbo-badge">${item.profName}</span>
          <div class="jokbo-title-text">${item.subject} (${item.type})</div>
          <div class="jokbo-meta">가격: <strong style="color:var(--primary-color);">${item.price} P</strong></div>
        </div>
        <button class="jokbo-buy-btn ${isOwned ? 'owned' : ''}" data-id="${item.id}">${isOwned ? '보유 완료' : '족보 구매'}</button>
      </div>
    `;
    })
    .join('');
}

function renderPurchasedJokboList() {
  const listEl = document.getElementById('purchased-jokbo-list');
  if (purchasedJokbo.length === 0) {
    listEl.innerHTML = `<li class="empty-msg">아직 구매한 족보가 없습니다.</li>`;
    return;
  }
  listEl.innerHTML = purchasedJokbo
    .map(
      (item) => `<li>📥 [${item.profName}] ${item.subject} - ${item.type}</li>`,
    )
    .join('');
}

function switchView(targetSection, menuBtn) {
  document
    .querySelectorAll('.page-view')
    .forEach((v) => v.classList.add('hidden'));
  document
    .querySelectorAll('.menu-item')
    .forEach((m) => m.classList.remove('active'));
  targetSection.classList.remove('hidden');
  if (menuBtn) menuBtn.classList.add('active');
}

// 이벤트 리스너 통합 바인딩
document.getElementById('logo-home-trigger').addEventListener('click', () => {
  switchView(
    document.getElementById('view-home'),
    document.getElementById('menu-home'),
  );
  renderProfessorList();
});
document.getElementById('menu-home').addEventListener('click', () => {
  currentMode = 'search';
  switchView(
    document.getElementById('view-home'),
    document.getElementById('menu-home'),
  );
  renderProfessorList();
});
document.getElementById('menu-bookmark').addEventListener('click', () => {
  currentMode = 'bookmark';
  switchView(
    document.getElementById('view-home'),
    document.getElementById('menu-bookmark'),
  );
  renderProfessorList();
});
document.getElementById('menu-jokbo').addEventListener('click', () => {
  switchView(
    document.getElementById('view-jokbo'),
    document.getElementById('menu-jokbo'),
  );
  renderJokboStore();
});
document.getElementById('menu-mypage').addEventListener('click', () => {
  switchView(
    document.getElementById('view-mypage'),
    document.getElementById('menu-mypage'),
  );
});

document
  .getElementById('home-search-input')
  .addEventListener('input', renderProfessorList);
document
  .getElementById('filter-dept')
  .addEventListener('change', renderProfessorList);
document
  .getElementById('filter-grade')
  .addEventListener('change', renderProfessorList);
document
  .getElementById('review-sort')
  .addEventListener('change', sortAndRenderReviews);

document.getElementById('home-prof-list').addEventListener('click', (e) => {
  const target = e.target;
  if (target.classList.contains('detail-view-btn')) {
    renderDetailPage(target.getAttribute('data-id'));
    switchView(document.getElementById('view-detail'), null);
  }
  const bBtn = target.closest('.bookmark-btn');
  if (bBtn) {
    const id = Number(bBtn.getAttribute('data-id'));
    if (bookmarkedIds.includes(id))
      bookmarkedIds = bookmarkedIds.filter((b) => b !== id);
    else bookmarkedIds.push(id);
    renderProfessorList();
  }
});

document.getElementById('btn-back-to-home').addEventListener('click', () => {
  switchView(
    document.getElementById('view-home'),
    document.getElementById('menu-home'),
  );
  renderProfessorList();
});

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document
      .querySelectorAll('.tab-btn')
      .forEach((b) => b.classList.remove('active'));
    document
      .querySelectorAll('.tab-content')
      .forEach((c) => c.classList.remove('active-content'));
    btn.classList.add('active');
    document
      .getElementById(btn.getAttribute('data-tab'))
      .classList.add('active-content');
  });
});

document.body.addEventListener('click', (e) => {
  if (
    e.target.id === 'btn-top-login-trigger' ||
    e.target.id === 'btn-sidebar-login'
  )
    openAuthModal('login');
});
document
  .getElementById('btn-close-auth-modal')
  .addEventListener('click', () =>
    document.getElementById('auth-modal').classList.add('hidden'),
  );
document
  .getElementById('go-to-register')
  .addEventListener('click', () => openAuthModal('register'));
document
  .getElementById('go-to-login')
  .addEventListener('click', () => openAuthModal('login'));

document.getElementById('btn-execute-login').addEventListener('click', () => {
  isLoggedIn = true;
  document.getElementById('auth-modal').classList.add('hidden');
  alert('🔑 정상적으로 로그인 연동되었습니다.');
  updateAuthUI();
});

document.getElementById('star-input-group').addEventListener('click', (e) => {
  if (e.target.classList.contains('star-seed')) {
    selectedRating = Number(e.target.getAttribute('data-value'));
    document.querySelectorAll('.star-seed').forEach((s, i) => {
      if (i < selectedRating) s.classList.add('active');
      else s.classList.remove('active');
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  renderProfessorList();
});
