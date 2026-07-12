let isLoggedIn = false;
let isCertified = false;
// 초기 기본 지급 포인트를 20포인트로 엄격히 고정
let userPoints = 20;
let userName = '을지유저';
let userStudentId = '20261234';
let bookmarkedIds = [1];
let currentProfId = 1;
let currentMode = 'search';
let selectedRating = 5;
let purchasedJokbo = [];
// 태그 기여를 이미 완료한 교수 id 목록 (교수당 1회만 +2P 지급 - 무한 파밍 방지)
let taggedProfessorIds = [];
// 포인트 획득/차감 전체 내역 로그 (최신이 배열 앞쪽) - '작업 내역' 탭 및 '포인트 획득 내역' 카드의 공통 소스
let pointHistoryLog = [];

function addPointHistory(label, delta) {
  pointHistoryLog.unshift({ label, delta });
  renderPointHistory();
}

const professorsData = [
  {
    id: 1,
    name: '김을지 교수님',
    college: '보건과학대학',
    dept: '물리치료학과',
    rating: 4.6,
    reviewCount: 128,
    grade: '1',
    tags: ['시험 핵심위주', '학점 깔끔', '출결 엄격'],
    subjects: ['온열치방학', '재활운동학'],
    // 다이어그램 탭 4대 핵심 지표 (1~5 척도) - 실제로는 리뷰 누적 평균으로 계산되어야 함
    diagramMetrics: {
      examDifficulty: 4.2,
      gradeDifficulty: 3.8,
      attendanceDifficulty: 4.5,
      workload: 3.1,
    },
    allTags: [
      { name: '시험난이도 높음', count: 68, max: 80 },
      { name: '과제 많음', count: 54, max: 80 },
      { name: '출결 간소화', count: 22, max: 80 },
    ],
    reviews: [
      {
        id: 101,
        writer: '익명 수강생',
        rating: 5,
        semester: '2026-1',
        text: '교수님께서 출제 범위를 시험난이도에 맞게 정확히 짚어주셔서 공부 방향 잡기가 정말 최고였습니다.',
        date: '2026.06.14',
        timestamp: new Date('2026-06-14').getTime(),
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
    tags: ['과제 없음', '출결 프리'],
    subjects: ['기초임상학', '실습'],
    diagramMetrics: {
      examDifficulty: 2.5,
      gradeDifficulty: 4.6,
      attendanceDifficulty: 1.8,
      workload: 1.5,
    },
    allTags: [{ name: '학점 혜자', count: 30, max: 50 }],
    reviews: [],
  },
];

// 기출 족보 상점용 기본 데이터 제공 (가격을 무조건 10포인트로 고정 적용)
const jokboStoreData = [
  {
    id: 501,
    profName: '김을지 교수님',
    subject: '운동처방학 기출족보',
    type: 'PDF · 18p',
    price: 10,
  },
  {
    id: 502,
    profName: '김을지 교수님',
    subject: '재활운동학 기출족보',
    type: 'PDF · 14p',
    price: 10,
  },
];

// 포인트 차감 및 연동 동적 업데이트 제어판 (가짜 125P 요소를 완벽 제거)
function updateAuthUI() {
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

    // 사이드바 및 마이페이지 내부의 모든 동적 포인트를 일원화하여 연동
    document.getElementById('user-points').innerText = userPoints;
    document.getElementById('mypage-points-dynamic').innerText = userPoints;
    document.getElementById('sidebar-user-name').innerText = userName;
    document.getElementById('sidebar-avatar-name').innerText =
      userName.substring(0, 2);
    document.getElementById('mypage-user-display').innerText = userName;
    document.getElementById('mypage-user-subdesc').innerText =
      `물리치료학과 · 학번: ${userStudentId}`;

    updateTagButtonState();

    if (isCertified) {
      writeLockOverlay.classList.add('hidden');
    } else {
      writeLockOverlay.classList.remove('hidden');
      reviewLockMsg.innerHTML =
        '🔒 <strong>마이페이지</strong>에서 [수강확인서 파일]을 인증 완료해야 후기 작성이 가능합니다.';
    }
    renderPointHistory();
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
  }
}

// 족보 상점 구매 메커니즘 구축 (무조건 10포인트 소모 조건 반영)
function renderJokboStore() {
  const container = document.getElementById('jokbo-list-container');
  if (!container) return;

  container.innerHTML = jokboStoreData
    .map((item) => {
      const isOwned = purchasedJokbo.some((p) => p.id === item.id);
      return `
      <div class="jokbo-card">
        <div>
          <span class="jokbo-badge">${item.profName}</span>
          <div class="jokbo-title-text">${item.subject}</div>
          <div class="jokbo-meta">유형: ${item.type} · 가격: <strong style="color:var(--primary-color);">${item.price} P</strong></div>
        </div>
        <button class="jokbo-buy-btn ${isOwned ? 'owned' : ''}" data-id="${item.id}" ${isOwned ? 'disabled' : ''}>
          ${isOwned ? '보유 완료' : '족보 구매'}
        </button>
      </div>
    `;
    })
    .join('');
}

// 족보 상점 내 클릭 액션 핸들링
document.body.addEventListener('click', (e) => {
  if (
    e.target.classList.contains('jokbo-buy-btn') &&
    !e.target.classList.contains('owned')
  ) {
    if (!isLoggedIn) {
      alert('족보 구매는 로그인이 필요합니다.');
      openAuthModal('login');
      return;
    }

    const jokboId = Number(e.target.getAttribute('data-id'));
    const item = jokboStoreData.find((j) => j.id === jokboId);

    if (item) {
      if (userPoints < item.price) {
        alert(
          `포인트가 부족합니다! (현재 보유: ${userPoints}P / 필요: ${item.price}P)\n리뷰 작성이나 태그 기여로 포인트를 획득하세요.`,
        );
        return;
      }

      userPoints -= item.price; // 무조건 10포인트 차감
      purchasedJokbo.push(item);
      addPointHistory(`${item.subject} 구매 차감`, -item.price);
      alert(
        `🎁 [${item.subject}]를 성공적으로 구매했습니다. 10포인트가 차감되었습니다.`,
      );

      updateAuthUI();
      renderJokboStore();
    }
  }
});

// 포인트 획득 내역 렌더링 - 마이페이지 '포인트' 카드(최근 5개)와 '작업 내역' 탭(전체)에 공통 사용
function renderPointHistory() {
  const renderItems = (list) =>
    list.length
      ? list
          .map(
            (h) => `
      <li>
        <span>${h.label}</span>
        <strong class="${h.delta >= 0 ? 'plus-p' : 'minus-p'}">${h.delta >= 0 ? '+' : ''}${h.delta}P</strong>
      </li>`,
          )
          .join('')
      : `<li class="empty-msg">아직 활동 내역이 없습니다.</li>`;

  const miniEl = document.getElementById('mini-history-list');
  if (miniEl) miniEl.innerHTML = renderItems(pointHistoryLog.slice(0, 5));

  const fullEl = document.getElementById('full-history-list');
  if (fullEl) fullEl.innerHTML = renderItems(pointHistoryLog);
}

// 마이페이지 좌측 소메뉴(mp-nav-item) 탭 전환
function switchMypageTab(tab) {
  document.querySelectorAll('.mp-nav-item[data-tab]').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
  });
  document.querySelectorAll('.mp-tab-panel').forEach((panel) => {
    panel.classList.toggle('hidden', panel.id !== `mp-panel-${tab}`);
  });

  if (tab === 'point' || tab === 'history') renderPointHistory();
  if (tab === 'jokbo') renderPurchasedJokboList();
  if (tab === 'bookmark') renderBookmarkListInMypage();
  if (tab === 'edit') fillEditProfileForm();
}

// 마이페이지 '찜 목록' 탭 - 저장한 교수 리스트
function renderBookmarkListInMypage() {
  const listEl = document.getElementById('mypage-bookmark-list');
  if (!listEl) return;

  const bookmarked = professorsData.filter((p) => bookmarkedIds.includes(p.id));
  if (bookmarked.length === 0) {
    listEl.innerHTML = `<li class="empty-msg">아직 찜한 교수님이 없습니다. 교수 검색에서 찜해 보세요!</li>`;
    return;
  }
  listEl.innerHTML = bookmarked
    .map(
      (p) => `
    <li>
      <span class="material-icons-outlined" style="color:var(--primary-color); font-size:16px;">bookmark</span>
      <strong>${p.name}</strong> - ${p.college} ${p.dept} (★ ${p.rating.toFixed(1)})
      <button class="detail-view-btn" style="padding:4px 8px; font-size:11px; margin-left:auto;" data-id="${p.id}" id="mp-bookmark-goto-${p.id}">교수 보러가기</button>
    </li>
  `,
    )
    .join('');

  listEl.querySelectorAll('.detail-view-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      renderDetailPage(btn.getAttribute('data-id'));
      switchView(document.getElementById('view-detail'), null);
    });
  });
}

// 마이페이지 '내 정보 수정' 탭 - 입력창에 현재 값 채우기
function fillEditProfileForm() {
  const nameInput = document.getElementById('edit-user-name');
  const idInput = document.getElementById('edit-user-student-id');
  if (nameInput) nameInput.value = userName;
  if (idInput) idInput.value = userStudentId;
}

document.getElementById('btn-save-profile').addEventListener('click', () => {
  const newName = document.getElementById('edit-user-name').value.trim();
  const newStudentId = document
    .getElementById('edit-user-student-id')
    .value.trim();

  if (!newName || !newStudentId) {
    alert('이름과 학번을 모두 입력해 주세요.');
    return;
  }

  userName = newName;
  userStudentId = newStudentId;
  updateAuthUI();
  alert('✅ 내 정보가 수정되었습니다.');
});

document.querySelector('.mypage-aside-nav').addEventListener('click', (e) => {
  const btn = e.target.closest('.mp-nav-item[data-tab]');
  if (btn) switchMypageTab(btn.getAttribute('data-tab'));
});


function renderPurchasedJokboList() {
  const listEl = document.getElementById('purchased-jokbo-list');
  if (!listEl) return;

  if (purchasedJokbo.length === 0) {
    listEl.innerHTML = `<li class="empty-msg">아직 구매하거나 등록한 족보가 없습니다. 상점에서 교환해 보세요!</li>`;
    return;
  }
  listEl.innerHTML = purchasedJokbo
    .map(
      (item) => `
    <li>
      <span class="material-icons-outlined" style="color:var(--primary-color); font-size:16px;">description</span>
      <strong>[보유] ${item.subject}</strong> - ${item.profName} (${item.type}) 
      <button class="detail-view-btn" style="padding:4px 8px; font-size:11px; margin-left:auto;" onclick="alert('족보 파일 다운로드가 시작됩니다.')">족보 보러가기</button>
    </li>
  `,
    )
    .join('');
}

// 신규 족보 업로드 등록 기능 (기본 가격 무조건 10P 강제 고정)
document
  .getElementById('btn-submit-new-jokbo')
  .addEventListener('click', () => {
    const prof = document.getElementById('jk-prof').value.trim();
    const sub = document.getElementById('jk-subject').value.trim();
    const type = document.getElementById('jk-type').value.trim();

    if (!prof || !sub || !type) {
      alert('모든 항목을 올바르게 기입해 주세요.');
      return;
    }

    const newId = Date.now();
    const newJokbo = {
      id: newId,
      profName: prof,
      subject: sub + ' 기출족보',
      type: type,
      price: 10,
    };

    jokboStoreData.unshift(newJokbo);
    document.getElementById('jokbo-write-modal').classList.add('hidden');
    alert(
      '✨ 회원님의 기출 족보가 상점에 등록되었습니다! (모든 족보 가격은 10P로 균일 책정됩니다)',
    );
    renderJokboStore();
  });

// 수강확인서 파일 제출 가상 모션 연동
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
        '🎉 학생 수강인증이 확인되었습니다. 이제 클린리뷰 등록 권한이 활성화됩니다.',
      );
      updateAuthUI();
    }
  });

// 리뷰 무조건 익명으로 데이터 주입 및 보상 처리
document.getElementById('btn-submit-review').addEventListener('click', () => {
  const textInput = document.getElementById('input-review-text');
  const prof = professorsData.find((p) => p.id === currentProfId);

  if (textInput.value.trim().length < 10) {
    alert('성의있는 후기 평가를 10자 이상 작성해 주세요.');
    return;
  }

  const now = new Date();
  const timeString = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

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
  addPointHistory('리뷰 작성 보상', 3);
  textInput.value = '';
  alert('📝 클린 익명 리뷰가 게시되었습니다. 3포인트가 적립되었습니다.');
  updateAuthUI();
  sortAndRenderReviews();
});

// 검색 및 다중 조건 필터 엔진
function renderProfessorList() {
  const homeProfList = document.getElementById('home-prof-list');
  if (!homeProfList) return;
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

  data = data.filter((p) => {
    const matchQuery =
      p.name.toLowerCase().includes(query) ||
      p.dept.toLowerCase().includes(query);
    const matchDept = filterDept === 'all' || p.dept === filterDept;
    const matchGrade = filterGrade === 'all' || p.grade === filterGrade;
    return matchQuery && matchDept && matchGrade;
  });

  if (data.length === 0) {
    homeProfList.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-muted); font-size:13px;">조건에 부합하는 교수님 정보가 존재하지 않습니다.</div>`;
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

function sortAndRenderReviews() {
  const prof = professorsData.find((p) => p.id === currentProfId);
  const container = document.getElementById('review-list-container');
  if (!container || !prof) return;

  const sortValue = document.getElementById('review-sort').value;
  let sorted = [...prof.reviews];
  if (sortValue === 'latest') sorted.sort((a, b) => b.timestamp - a.timestamp);
  else if (sortValue === 'rating') sorted.sort((a, b) => b.rating - a.rating);

  if (sorted.length === 0) {
    container.innerHTML = `<p style="font-size:12px; color:var(--text-muted); text-align:center; padding:20px;">등록된 후기가 없습니다. 첫 후기를 남겨보세요!</p>`;
    return;
  }

  container.innerHTML = sorted
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

// 회원가입 완료 버튼 액션
document
  .getElementById('btn-execute-register')
  .addEventListener('click', () => {
    const email = document.getElementById('reg-email').value;
    const name = document.getElementById('reg-name').value;
    const studentId = document.getElementById('reg-student-id').value;

    if (!email || !name || !studentId) {
      alert('모든 회원가입 필수정보 란을 기입해 주세요.');
      return;
    }

    userName = name;
    userStudentId = studentId;
    userPoints = 20; // 가입 기본금 20포인트 지급 고정
    isLoggedIn = true;
    pointHistoryLog = [];
    addPointHistory('회원가입 기본 지급', 20);
    document.getElementById('auth-modal').classList.add('hidden');
    alert(
      `🎁 회원가입 축하드립니다, ${userName}님! 기본 지급 20포인트가 충전되었습니다.`,
    );
    updateAuthUI();
  });

// 태그 보상 처리 연동 (+2P) - 교수당 1회만 지급되도록 중복 방지
document
  .getElementById('btn-tag-input-trigger')
  .addEventListener('click', () => {
    if (!isLoggedIn) {
      alert('태그 기여는 로그인이 필요합니다.');
      openAuthModal('login');
      return;
    }
    if (taggedProfessorIds.includes(currentProfId)) {
      alert('이미 이 교수님에게 태그 기여를 완료하셨습니다. (교수당 1회)');
      return;
    }
    taggedProfessorIds.push(currentProfId);
    userPoints += 2;
    addPointHistory('태그 기여', 2);
    alert('🏷️ 태그 기여 완료! 2포인트가 실시간 적립되었습니다.');
    updateAuthUI();
    updateTagButtonState();
  });

// 태그 버튼 상태 갱신 - 이미 기여한 교수면 버튼을 비활성화 표시
function updateTagButtonState() {
  const btn = document.getElementById('btn-tag-input-trigger');
  const notice = document.getElementById('tag-notice-msg');
  if (!btn) return;

  const alreadyTagged = taggedProfessorIds.includes(currentProfId);
  btn.disabled = alreadyTagged;
  btn.style.opacity = alreadyTagged ? '0.5' : '1';
  btn.style.cursor = alreadyTagged ? 'default' : 'pointer';

  if (!isLoggedIn) return; // 로그인 안내 문구는 updateAuthUI가 관리
  if (notice) {
    notice.innerText = alreadyTagged
      ? '이미 이 교수님에게 태그 기여를 완료했어요. (교수당 1회)'
      : '교수님에 맞는 태그를 선택하여 등록해 보세요. (+2P)';
  }
}

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

// 다이어그램 탭 렌더링 - 막대그래프 4개 + 레이더(clip-path 사각형)를 교수 데이터로 채운다
function renderDiagram(prof) {
  const m = prof.diagramMetrics;
  if (!m) return;

  const setBar = (fillId, numId, value) => {
    document.getElementById(fillId).style.width = `${(value / 5) * 100}%`;
    document.getElementById(numId).innerText = value.toFixed(1);
  };
  setBar('bar-fill-exam', 'num-exam', m.examDifficulty);
  setBar('bar-fill-grade', 'num-grade', m.gradeDifficulty);
  setBar('bar-fill-attendance', 'num-attendance', m.attendanceDifficulty);
  setBar('bar-fill-workload', 'num-workload', m.workload);

  const total =
    (m.examDifficulty + m.gradeDifficulty + m.attendanceDifficulty + m.workload) / 4;
  document.getElementById('diagram-total-num').innerText =
    `${total.toFixed(1)} / 5.0`;

  // 4축 레이더: N=시험난이도, E=과제량, S=출결 난이도, W=학점난이도 (축 라벨과 동일하게 매칭)
  const nRatio = m.examDifficulty / 5;
  const eRatio = m.workload / 5;
  const sRatio = m.attendanceDifficulty / 5;
  const wRatio = m.gradeDifficulty / 5;

  const nY = 50 - nRatio * 50;
  const eX = 50 + eRatio * 50;
  const sY = 50 + sRatio * 50;
  const wX = 50 - wRatio * 50;

  document.getElementById('radar-polygon').style.clipPath =
    `polygon(50% ${nY}%, ${eX}% 50%, 50% ${sY}%, ${wX}% 50%)`;
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
  renderDiagram(prof);
  updateTagButtonState();
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

// 팝업 모달 이벤트 제어 바인딩
document
  .getElementById('btn-open-jokbo-modal')
  .addEventListener('click', () => {
    if (!isLoggedIn) {
      alert('족보 공유 및 업로드는 로그인이 필요합니다.');
      openAuthModal('login');
      return;
    }
    document.getElementById('jokbo-write-modal').classList.remove('hidden');
  });
document
  .getElementById('btn-close-jokbo-modal')
  .addEventListener('click', () =>
    document.getElementById('jokbo-write-modal').classList.add('hidden'),
  );

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
  updateAuthUI();
  switchMypageTab('point');
});

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

document.querySelectorAll('.tab-menu .tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document
      .querySelectorAll('.tab-menu .tab-btn')
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
    e.target.id === 'btn-sidebar-login' ||
    e.target.id === 'btn-diagram-login-trigger' ||
    e.target.id === 'btn-mypage-login-trigger'
  )
    openAuthModal('login');
  if (e.target.id === 'btn-logout') {
    isLoggedIn = false;
    isCertified = false;
    userPoints = 20;
    purchasedJokbo = [];
    taggedProfessorIds = [];
    pointHistoryLog = [];
    alert('로그아웃 되었습니다.');
    updateAuthUI();
    switchView(
      document.getElementById('view-home'),
      document.getElementById('menu-home'),
    );
    renderProfessorList();
  }
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
  if (pointHistoryLog.length === 0) {
    addPointHistory('회원가입 기본 지급', 20);
  }
  document.getElementById('auth-modal').classList.add('hidden');
  alert('🔑 정상적으로 연동 로그인되었습니다.');
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

document.getElementById('mp-history-more-link').addEventListener('click', () => {
  switchMypageTab('history');
});

document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  renderProfessorList();
});
