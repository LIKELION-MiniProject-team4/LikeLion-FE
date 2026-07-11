// ==========================================================================
// 📦 1. 글로벌 애플리케이션 상태 제어 트리
// ==========================================================================
let state = {
  isLoggedIn: false,
  user: null,
  currentMenu: 'professor',
  activeDetailTab: 'diagram',
  currentProfId: null,
  searchKeyword: '',
  selectedDept: '전체',
  purchasedItemIds: [],
  authTabMode: 'login', // 'login' 또는 'register' 폼 전환용 상태 변수
};

// ==========================================================================
// 💾 2. 모크 데이터베이스 코어
// ==========================================================================
const mockProfessors = [
  {
    id: 101,
    name: '김을지 교수님',
    college: '보건과학대학',
    department: '물리의학학과',
    subjects: '운열지학학, 재활운동학',
    rating: 4.6,
    reviewCount: 125,
    metrics: {
      difficulty: 3.5,
      task: 3.8,
      examClarity: 2.8,
      feedbackSpeed: 3.3,
      classAttitude: 4.0,
    },
    tags: ['설명 친절', '과제 적당', '시험 난이도 중'],
    reviews: [
      {
        author: '보건과학대학 재학생',
        rating: 5,
        date: '2026.07.11',
        term: '2026-1학기',
        text: '매 수업 핵심 지표 위주로 쉽게 풀어서 강의해주시며, 질문 피드백 대응이 대단히 명확하십니다.',
      },
    ],
  },
  {
    id: 102,
    name: '이첨단 교수님',
    college: '첨단융합대학',
    department: '첨단학부',
    subjects: '인공지능 개론, 데이터분석 실습',
    rating: 4.1,
    reviewCount: 38,
    metrics: {
      difficulty: 4.5,
      task: 4.2,
      examClarity: 3.5,
      feedbackSpeed: 3.8,
      classAttitude: 4.2,
    },
    tags: ['과제 많음', '실무 중심', '피드백 빠름'],
    reviews: [
      {
        author: '첨단학부 3학년',
        rating: 4,
        date: '2026.06.20',
        term: '2026-1학기',
        text: '과제 설계 장벽은 높지만 핵심 인공지능 엔지니어링 실무 역량을 확실히 기를 수 있습니다.',
      },
    ],
  },
];

const mockStoreItems = [
  {
    id: 501,
    title: '[김을지 교수] 운열지학학 2025년도 1학기 기말고사 정답 복원 교안집',
    profName: '김을지 교수님',
    cost: 150,
    downloads: 84,
    content:
      '운열지학학 기말고사 기출 서술형 3문항 100% 정밀 복원 및 채점 기준 요약본 파일 본문입니다.',
  },
  {
    id: 502,
    title: '[이첨단 교수] 인공지능 개론 중간고사 족보 가이드라인 및 소스코드',
    profName: '이첨단 교수님',
    cost: 200,
    downloads: 132,
    content:
      '인공지능 개론 중간 코딩 테스트 대비 머신러닝 선형회귀 모델 구현 문제 족보 파일 본문입니다.',
  },
];

// ==========================================================================
// 🔄 3. 라우팅 허브
// ==========================================================================
function switchPage(menuName) {
  state.currentMenu = menuName;
  if (menuName !== 'auth') state.currentProfId = null;

  document
    .querySelectorAll('.menu-item')
    .forEach((item) => item.classList.remove('active'));
  const targetMenu = document.getElementById(`menu-${menuName}`);
  if (targetMenu) targetMenu.classList.add('active');

  const searchBlock = document.getElementById('searchSectionBlock');
  const container = document.getElementById('mainContentContainer');
  const pageHeading = document.getElementById('pageMainHeading');
  const filters = document.getElementById('filterOptionsContainer');

  if (menuName === 'professor') {
    searchBlock.style.display = 'block';
    pageHeading.innerText = '전공 교수 체크';
    filters.style.display = 'flex';
    container.innerHTML = `<div id="professorListWrapper"></div>`;
    renderProfessorList();
  } else if (menuName === 'store') {
    searchBlock.style.display = 'block';
    pageHeading.innerText = '비밀 족보 스토어';
    filters.style.display = 'none';
    container.innerHTML = `<div id="storeListWrapper"></div>`;
    renderStoreList();
  } else if (menuName === 'mypage') {
    if (!state.isLoggedIn) {
      switchPage('auth'); // 비로그인이면 전용 회원가입/로그인 뷰로 리다이렉트
      return;
    }
    searchBlock.style.display = 'none';
    renderMyPageWorkspace(container);
  } else if (menuName === 'auth') {
    searchBlock.style.display = 'none';
    renderAuthPageLayout(container);
  }
}

function renderProfessorList() {
  const wrapper = document.getElementById('professorListWrapper');
  if (!wrapper) return;
  wrapper.innerHTML = '';

  const filtered = mockProfessors.filter((p) => {
    const matchesSearch =
      p.name.includes(state.searchKeyword) ||
      p.subjects.includes(state.searchKeyword);
    const matchesDept =
      state.selectedDept === '전체' || p.department === state.selectedDept;
    return matchesSearch && matchesDept;
  });

  filtered.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'item-list-card';
    card.innerHTML = `
            <div>
                <h3 style="font-size:16px; margin-bottom:4px; font-weight:700;">${p.name}</h3>
                <p style="font-size:12px; color:var(--text-sub);">${p.college} • <span style="color:var(--primary-color); font-weight:600;">${p.department}</span> | 과목: ${p.subjects}</p>
            </div>
            <button class="action-btn btn-blue" onclick="viewProfessorDetail(${p.id})">교수 정보 열람</button>
        `;
    wrapper.appendChild(card);
  });
}

function renderStoreList() {
  const wrapper = document.getElementById('storeListWrapper');
  if (!wrapper) return;
  wrapper.innerHTML = '';

  mockStoreItems.forEach((item) => {
    const isPurchased = state.purchasedItemIds.includes(item.id);
    const card = document.createElement('div');
    card.className = 'item-list-card';
    card.innerHTML = `
            <div>
                <h3 style="font-size:14px; font-weight:700; margin-bottom:4px;">${item.title}</h3>
                <p style="font-size:12px; color:var(--text-muted);">${item.profName} • 다운로드 ${item.downloads}회</p>
            </div>
            ${
              isPurchased
                ? `<button class="action-btn" onclick="switchPage('mypage')" style="color:var(--primary-color); border-color:var(--primary-color);">보관함 보기</button>`
                : `<button class="action-btn btn-blue" onclick="purchaseStoreItem(${item.id}, ${item.cost})"><span class="material-symbols-outlined" style="font-size:16px;">download</span> ${item.cost}P</button>`
            }
        `;
    wrapper.appendChild(card);
  });
}

// ==========================================================================
// 🔐 4. 교수 상세 대시보드 뷰어
// ==========================================================================
function viewProfessorDetail(profId) {
  const p = mockProfessors.find((item) => item.id === profId);
  if (!p) return;

  state.currentProfId = profId;
  document.getElementById('searchSectionBlock').style.display = 'none';
  const container = document.getElementById('mainContentContainer');

  container.innerHTML = `
        <div class="breadcrumb">교수 검색 &nbsp;/&nbsp; ${p.college} &nbsp;/&nbsp; <span style="color:var(--text-main); font-weight:600;">${p.department}</span></div>
        <div class="header-action-row">
            <div class="title-area">
                <span class="material-symbols-outlined back-btn" onclick="switchPage('professor')">arrow_back</span>
                <div>
                    <h2 style="font-size: 20px; font-weight: 700;">${p.name}</h2>
                    <p style="font-size: 12px; color: var(--text-muted); margin-top:2px;">${p.college} ${p.department} • 담당과목: ${p.subjects}</p>
                </div>
            </div>
            <button class="action-btn btn-blue" onclick="openReviewModal()">리뷰 쓰기</button>
        </div>

        <div class="info-cards-grid">
            <div class="summary-card">
                <div class="summary-card-title">전체 평점</div>
                <div style="font-size:28px; font-weight:800; margin-top:8px;">★ ${p.rating.toFixed(1)}</div>
                <p style="font-size:11px; color:var(--text-muted); margin-top:4px;">${p.reviewCount}개 리뷰 기준</p>
            </div>
            <div class="summary-card">
                <div class="summary-card-title">주요 태그 TOP 3</div>
                <div style="margin-top:14px;">
                    ${p.tags.map((tag, i) => `<span class="tag-pill"><span class="badge-idx">${i + 1}</span>${tag}</span>`).join('')}
                </div>
            </div>
        </div>

        <div class="tabs-header">
            <div class="tab-item ${state.activeDetailTab === 'tag' ? 'active' : ''}" onclick="switchDetailTab('tag')">태그 요약</div>
            <div class="tab-item ${state.activeDetailTab === 'diagram' ? 'active' : ''}" onclick="switchDetailTab('diagram')">다이어그램 통계</div>
            <div class="tab-item ${state.activeDetailTab === 'review' ? 'active' : ''}" onclick="switchDetailTab('review')">선배들 리뷰 (${p.reviews.length})</div>
        </div>

        <div class="blur-restricted-container">
            <div id="tabContentBlock" class="${!state.isLoggedIn ? 'blur-content-layer' : ''}"></div>
            ${
              !state.isLoggedIn
                ? `
                <div class="lock-overlay-gate">
                    <span class="material-symbols-outlined" style="font-size:40px; color:var(--primary-color); margin-bottom:12px;">lock</span>
                    <h4 style="font-size:15px; font-weight:700; color:var(--text-main); margin-bottom:6px;">을지대학교 학생 인증 안내</h4>
                    <p style="font-size:12px; color:var(--text-sub); margin-bottom:16px;">상세 통계 지표 및 생생한 후기를 열람하시려면 포털 연동 인증이 필요합니다.</p>
                    <button class="action-btn btn-blue" onclick="switchPage('auth')">포털 계정 연동 인증하기</button>
                </div>
            `
                : ''
            }
        </div>
    `;

  renderTabPanelContent(p);
}

function switchDetailTab(tabName) {
  state.activeDetailTab = tabName;
  viewProfessorDetail(state.currentProfId);
}

// ==========================================================================
// 📄 5. [완벽 복구] 태그 요약 탭 렌더링을 포함한 콘텐츠 분기 엔진
// ==========================================================================
function renderTabPanelContent(prof) {
  const block = document.getElementById('tabContentBlock');
  if (!block) return;

  if (state.activeDetailTab === 'tag') {
    // 📸 스크린샷 1의 구조를 그대로 복구한 태그 요약 인터페이스 설계
    block.innerHTML = `
            <div style="background:#fff; border:1px solid var(--border-color); border-radius:12px; padding:24px;">
                <h4 style="font-size:14px; font-weight:700; margin-bottom:16px; color:var(--text-main);">선배들이 선택한 주요 강의 키워드</h4>
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <div style="padding:16px; background:var(--bg-main); border-radius:8px; border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <strong style="color:var(--primary-color); font-size:14px;">#설명_친절</strong>
                            <p style="font-size:12px; color:var(--text-sub); margin-top:2px;">교수님의 설명 방식에 대한 만족도가 대단히 높은 편입니다.</p>
                        </div>
                        <span style="font-weight:700; color:var(--text-main); font-size:13px;">94%의 학우 선택</span>
                    </div>
                    <div style="padding:16px; background:var(--bg-main); border-radius:8px; border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <strong style="color:var(--primary-color); font-size:14px;">#과제_적당</strong>
                            <p style="font-size:12px; color:var(--text-sub); margin-top:2px;">학기 중 부여되는 과제 밸런스가 매우 합리적입니다.</p>
                        </div>
                        <span style="font-weight:700; color:var(--text-main); font-size:13px;">81%의 학우 선택</span>
                    </div>
                    <div style="padding:16px; background:var(--bg-main); border-radius:8px; border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <strong style="color:var(--primary-color); font-size:14px;">#시험_난이도_중</strong>
                            <p style="font-size:12px; color:var(--text-sub); margin-top:2px;">수업 내용과 교안을 충실하게 따라가면 무난히 풀 수 있는 수준입니다.</p>
                        </div>
                        <span style="font-weight:700; color:var(--text-main); font-size:13px;">76%의 학우 선택</span>
                    </div>
                </div>
            </div>
        `;
  } else if (state.activeDetailTab === 'diagram') {
    block.innerHTML = `
            <div class="diagram-dashboard">
                <div class="dashboard-panel" style="text-align: center;">
                    <h4 style="font-size: 13.5px; font-weight: 700; margin-bottom: 20px;">종합 교수 평가 다이어그램</h4>
                    <div style="display: flex; justify-content: center; align-items: center;">
                        <canvas id="radarChartCanvas" width="240" height="240"></canvas>
                    </div>
                </div>
                <div class="dashboard-panel">
                    <h4 style="font-size: 13.5px; font-weight: 700; margin-bottom:20px;">항목별 세부 데이터</h4>
                    <div id="barChartContainer"></div>
                </div>
            </div>
        `;
    drawRadarChart5Axis(prof.metrics);
    animateBarCharts(prof.metrics);
  } else if (state.activeDetailTab === 'review') {
    block.innerHTML = `
            <div style="background:#fff; border:1px solid var(--border-color); border-radius:12px; padding:24px;">
                ${prof.reviews
                  .map(
                    (r) => `
                    <div class="review-row-item">
                        <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:12px;">
                            <span style="font-weight:700;">${r.author} <span style="color:var(--primary-color); margin-left:4px;">★ ${r.rating}</span></span>
                            <span style="color:var(--text-muted);">${r.date}</span>
                        </div>
                        <p style="font-size:13.5px; color:var(--text-sub); line-height:1.5;">${r.text}</p>
                    </div>
                `,
                  )
                  .join('')}
            </div>
        `;
  }
}

// ==========================================================================
// 🎨 6. 5각 캔버스 및 가로 그래프 처리 자동화 엔진
// ==========================================================================
function drawRadarChart5Axis(metrics) {
  const canvas = document.getElementById('radarChartCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const maxRadius = 75;
  const labels = [
    '난이도',
    '과제량',
    '시험 명확성',
    '피드백 속도',
    '수업 태도',
  ];
  const values = [
    metrics.difficulty,
    metrics.task,
    metrics.examClarity,
    metrics.feedbackSpeed,
    metrics.classAttitude,
  ];

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#E2E8F0';

  for (let i = 1; i <= 5; i++) {
    const r = maxRadius * (i / 5);
    ctx.beginPath();
    for (let j = 0; j < 5; j++) {
      const angle = ((Math.PI * 2) / 5) * j - Math.PI / 2;
      if (j === 0)
        ctx.moveTo(
          centerX + r * Math.cos(angle),
          centerY + r * Math.sin(angle),
        );
      else
        ctx.lineTo(
          centerX + r * Math.cos(angle),
          centerY + r * Math.sin(angle),
        );
    }
    ctx.closePath();
    ctx.stroke();
  }

  ctx.font = '11px Noto Sans KR';
  ctx.fillStyle = '#5F6470';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let j = 0; j < 5; j++) {
    const angle = ((Math.PI * 2) / 5) * j - Math.PI / 2;
    ctx.fillText(
      labels[j],
      centerX + (maxRadius + 18) * Math.cos(angle),
      centerY + (maxRadius + 10) * Math.sin(angle),
    );
  }

  ctx.strokeStyle = 'rgba(77, 105, 250, 0.85)';
  ctx.fillStyle = 'rgba(77, 105, 250, 0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let j = 0; j < 5; j++) {
    const angle = ((Math.PI * 2) / 5) * j - Math.PI / 2;
    const r = maxRadius * (values[j] / 5);
    if (j === 0)
      ctx.moveTo(centerX + r * Math.cos(angle), centerY + r * Math.sin(angle));
    else
      ctx.lineTo(centerX + r * Math.cos(angle), centerY + r * Math.sin(angle));
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function animateBarCharts(metrics) {
  const container = document.getElementById('barChartContainer');
  if (!container) return;

  const arr = [
    { label: '난이도 기준점', val: metrics.difficulty },
    { label: '과제 부담감', val: metrics.task },
    { label: '시험출제 명확성', val: metrics.examClarity },
    { label: '실시간 피드백 속도', val: metrics.feedbackSpeed },
    { label: '교수님 수업 태도', val: metrics.classAttitude },
  ];

  container.innerHTML = arr
    .map(
      (item, i) => `
        <div class="bar-chart-row">
            <div class="bar-chart-info">
                <span style="color:var(--text-sub); font-size:11.5px;">${item.label}</span>
                <span style="font-weight:700;">${item.val.toFixed(1)} / 5.0</span>
            </div>
            <div class="bar-chart-bg">
                <div class="bar-chart-fill" id="coreBarFill_${i}"></div>
            </div>
        </div>
    `,
    )
    .join('');

  setTimeout(() => {
    arr.forEach((item, i) => {
      const b = document.getElementById(`coreBarFill_${i}`);
      if (b) b.style.width = `${(item.val / 5) * 100}%`;
    });
  }, 50);
}

// ==========================================================================
// 🔐 7. [완벽 복구] 모달이 아닌 메인 전용 로그인/회원가입 인라인 페이지 뷰어
// ==========================================================================
function renderAuthPageLayout(container) {
  // 스크린샷 2의 정밀한 이메일 / 패스워드 폼 인터페이스 연동 복구
  container.innerHTML = `
        <div class="auth-center-box">
            <div class="auth-tab-row">
                <div class="auth-tab-btn ${state.authTabMode === 'login' ? 'active' : ''}" onclick="toggleAuthMode('login')">포털 로그인</div>
                <div class="auth-tab-btn ${state.authTabMode === 'register' ? 'active' : ''}" onclick="toggleAuthMode('register')">학적 회원가입</div>
            </div>
            
            <div id="authFormFieldsBlock"></div>
        </div>
    `;

  const formBlock = document.getElementById('authFormFieldsBlock');
  if (state.authTabMode === 'login') {
    formBlock.innerHTML = `
            <div class="form-group">
                <label>을지대학교 종합포털 이메일</label>
                <input type="text" id="authEmail" class="form-control" placeholder="student@eulji.ac.kr">
            </div>
            <div class="form-group" style="margin-bottom:24px;">
                <label>비밀번호</label>
                <input type="password" id="authPassword" class="form-control" placeholder="••••••">
            </div>
            <button class="action-btn btn-blue" style="width:100%; padding:12px; justify-content:center; font-weight:600;" onclick="executeLoginAction()">학적 통합 연동 로그인</button>
        `;
  } else {
    formBlock.innerHTML = `
            <div class="form-group">
                <label>성명</label>
                <input type="text" id="regName" class="form-control" placeholder="홍길동">
            </div>
            <div class="form-group">
                <label>소속 학과 선택</label>
                <select id="regDept" class="form-control">
                    <option value="물리의학학과">물리의학학과</option>
                    <option value="첨단학부">첨단학부</option>
                </select>
            </div>
            <div class="form-group">
                <label>을지대학교 공식 이메일 학적 계정</label>
                <input type="text" id="regEmail" class="form-control" placeholder="student@eulji.ac.kr">
            </div>
            <div class="form-group" style="margin-bottom:24px;">
                <label>신규 비밀번호 설정</label>
                <input type="password" id="regPassword" class="form-control" placeholder="••••••">
            </div>
            <button class="action-btn btn-blue" style="width:100%; padding:12px; justify-content:center; font-weight:600;" onclick="executeRegisterAction()">포털 연동 회원가입 완료</button>
        `;
  }
}

function toggleAuthMode(mode) {
  state.authTabMode = mode;
  const container = document.getElementById('mainContentContainer');
  renderAuthPageLayout(container);
}

function executeLoginAction() {
  const email = document.getElementById('authEmail').value;
  if (!email.includes('@eulji.ac.kr') && email !== 'test') {
    alert('을지대학교 계정(@eulji.ac.kr)으로만 로그인이 가능합니다.');
    return;
  }

  state.isLoggedIn = true;
  state.user = {
    name: '김을지',
    dept: '물리의학학과',
    points: 450,
    isCertified: false,
    certifiedFile: null,
  };
  updateSidebarProfileUI();
  alert('🎉 을지대학교 학적 동기화 완료! 환영합니다.');
  switchPage('professor');
}

function executeRegisterAction() {
  const name = document.getElementById('regName').value;
  const dept = document.getElementById('regDept').value;
  if (!name) {
    alert('이름을 기입해 주세요.');
    return;
  }

  state.isLoggedIn = true;
  state.user = {
    name: name,
    dept: dept,
    points: 200,
    isCertified: false,
    certifiedFile: null,
  }; // 가입 보너스 200P
  updateSidebarProfileUI();
  alert(
    '🎉 회원가입 및 종합 포털 연동인증에 성공했습니다. 가입 기념 200P가 적립되었습니다.',
  );
  switchPage('professor');
}

function executeLogout() {
  if (confirm('안전하게 로그아웃 하시겠습니까?')) {
    state.isLoggedIn = false;
    state.user = null;
    state.purchasedItemIds = [];
    updateSidebarProfileUI();
    switchPage('professor');
  }
}

// ==========================================================================
// 🛍️ 8. 트랜잭션 및 보관함 로직
// ==========================================================================
function purchaseStoreItem(itemId, cost) {
  if (!state.isLoggedIn) {
    alert('학적 연동 후 족보 다운로드가 허용됩니다.');
    switchPage('auth');
    return;
  }
  if (state.user.points < cost) {
    alert('포인트 잔액이 부족합니다. 리뷰를 작성하고 포인트를 받으세요.');
    return;
  }

  if (confirm(`해당 자료 구매를 위해 ${cost} 포인트를 차감할까요?`)) {
    state.user.points -= cost;
    state.purchasedItemIds.push(itemId);
    updateSidebarProfileUI();
    alert(
      "🎉 다운로드가 완료되었습니다! 마이페이지 '기출 족보 열람 보관함'에서 즉시 확인하세요.",
    );
    renderStoreList();
  }
}

function openReviewModal() {
  if (!state.isLoggedIn) {
    alert('포털 로그인 학우님만 리뷰 작성이 가능합니다.');
    switchPage('auth');
    return;
  }
  openModal('reviewModal');
}

function submitReviewAction() {
  const p = mockProfessors.find((item) => item.id === state.currentProfId);
  const textVal = document.getElementById('revText').value;
  if (textVal.length < 10) {
    alert('후기를 10자 이상 적어주세요.');
    return;
  }

  p.reviews.unshift({
    author: `${state.user.dept} 학우`,
    rating: parseFloat(document.getElementById('revRating').value),
    date: '2026.07.11',
    term: document.getElementById('revTerm').value,
    text: textVal,
  });

  state.user.points += 50;
  updateSidebarProfileUI();
  closeModal('reviewModal');
  alert('📢 리뷰 등록 성공! 50P가 충전되었습니다.');
  viewProfessorDetail(p.id);
}

// ==========================================================================
// 👤 9. 마이페이지 워크스페이스
// ==========================================================================
function renderMyPageWorkspace(container) {
  const purchasedObjects = mockStoreItems.filter((item) =>
    state.purchasedItemIds.includes(item.id),
  );

  container.innerHTML = `
        <h1 style="font-size:20px; font-weight:700; margin-bottom:24px;">내 활동 및 강의 관리 허브</h1>
        <div style="display:grid; grid-template-columns: 1fr 1.2fr; gap:24px; align-items: start;">
            <div style="display:flex; flex-direction:column; gap:20px;">
                <div style="background:#fff; border:1px solid var(--border-color); border-radius:16px; padding:28px;">
                    <p style="font-size:12px; color:var(--text-muted); font-weight:500;">포털 학적 정보</p>
                    <h2 style="font-size:20px; font-weight:700; margin-top:4px; margin-bottom:16px;">
                        ${state.user.name} <span style="font-size:14px; font-weight:400; color:var(--text-sub);">${state.user.dept}</span>
                    </h2>
                    <div style="padding:16px; background:var(--bg-main); border-radius:10px; display:flex; justify-content:space-between; align-items:center; border:1px solid var(--border-color);">
                        <span style="font-size:13px; color:var(--text-sub);">현재 보유한 다운로드 포인트</span>
                        <strong style="color:var(--primary-color); font-size:18px; font-weight:800;">${state.user.points} P</strong>
                    </div>
                </div>

                <div style="background:#fff; border:1px solid var(--border-color); border-radius:16px; padding:28px;">
                    <h3 style="font-size:15px; font-weight:700; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
                        <span class="material-symbols-outlined" style="color:var(--primary-color); font-size:20px;">verified_user</span>정회원 강의 수강 서류 증명인증
                    </h3>
                    <p style="font-size:12px; color:var(--text-sub); margin-bottom:16px; line-height:1.4;">
                        포털 수강확인서 서류를 등록하시면 보너스 300P 지급 및 기밀 커뮤니티 등급이 활성화됩니다.
                    </p>
                    <div class="file-upload-dropzone" onclick="triggerHiddenFileInput()">
                        <span class="material-symbols-outlined" style="font-size:32px; color:var(--text-muted);">cloud_upload</span>
                        <p style="font-size:12.5px; margin-top:6px; color:var(--text-sub);">수강 서류 업로드 (클릭)</p>
                        <input type="file" id="hiddenAuthFileInput" style="display:none;" onchange="handleAuthFileSelection(this)">
                    </div>
                    <div id="authFileUploadBadgeArea">
                        ${state.user.isCertified ? `<div class="file-uploaded-badge">✓ 등록 완료: ${state.user.certifiedFile} (심사 중)</div>` : ''}
                    </div>
                </div>
            </div>

            <div style="background:#fff; border:1px solid var(--border-color); border-radius:16px; padding:28px;">
                <h3 style="font-size:15px; font-weight:700; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                    <span class="material-symbols-outlined" style="color:orange; font-size:20px;">folder_open</span>내가 구매한 기출 족보 열람 보관함
                </h3>
                <p style="font-size:12px; color:var(--text-muted); margin-bottom:20px;">결제가 완료되어 영구 열람이 가능한 원문 리스트입니다.</p>
                <div id="mypagePurchasedContainer">
                    ${
                      purchasedObjects.length === 0
                        ? `
                        <p style="color:var(--text-muted); text-align:center; font-size:12px; padding:30px;">구매한 족보 내역이 없습니다.</p>
                    `
                        : purchasedObjects
                            .map(
                              (item) => `
                        <div style="border:1px solid var(--border-color); border-radius:10px; padding:16px; margin-bottom:12px; background:var(--bg-main);">
                            <h4 style="font-size:13px; font-weight:700; margin-bottom:8px;">${item.title}</h4>
                            <div style="background:#fff; border:1px solid var(--border-color); padding:12px; border-radius:6px; font-size:12px; color:var(--text-sub); white-space:pre-wrap;">${item.content}</div>
                        </div>
                    `,
                            )
                            .join('')
                    }
                </div>
            </div>
        </div>
    `;
}

function triggerHiddenFileInput() {
  document.getElementById('hiddenAuthFileInput').click();
}
function handleAuthFileSelection(input) {
  if (!input.files.length) return;
  state.user.isCertified = true;
  state.user.certifiedFile = input.files[0].name;
  alert('인증 서류가 임시 업로드 되었습니다. 운영진 검수 후 처리됩니다.');
  switchPage('mypage');
}

// ==========================================================================
// 🛠️ 10. 초기화 인프라
// ==========================================================================
function openModal(id) {
  document.getElementById(id).style.display = 'flex';
}
function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}
function handleLiveSearch() {
  state.searchKeyword = document.getElementById('globalSearchInput').value;
  if (state.currentMenu === 'professor') renderProfessorList();
  else if (state.currentMenu === 'store') renderStoreList();
}
function handleFilterChange() {
  state.selectedDept = document.getElementById('deptFilter').value;
  renderProfessorList();
}

function updateSidebarProfileUI() {
  const card = document.getElementById('sidebarProfile');
  const logoutBtn = document.getElementById('sidebarLogoutBtn');
  if (!card) return;

  if (state.isLoggedIn && state.user) {
    card.innerHTML = `<div class="profile-avatar">${state.user.name[0]}</div><div class="profile-info"><h4>${state.user.name}</h4><p>${state.user.dept} • <b style="color:var(--primary-color);">${state.user.points}P</b></p></div>`;
    if (logoutBtn) logoutBtn.style.display = 'flex';
  } else {
    card.innerHTML = `<div class="profile-avatar" style="background:#E2E8F0; color:var(--text-sub);"><span class="material-symbols-outlined" style="font-size:16px;">person</span></div><div class="profile-info"><h4>로그인 필요</h4><p style="cursor:pointer; color:var(--primary-color); font-weight:600;" onclick="switchPage('auth')">포털 연동인증</p></div>`;
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}

window.onload = function () {
  updateSidebarProfileUI();
  switchPage('professor');
};
