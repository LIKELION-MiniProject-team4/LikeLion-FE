// ==========================================================================
// 📦 1. 글로벌 애플리케이션 상태 제어 트리
// ==========================================================================
let state = {
  isLoggedIn: false,
  user: null,
  currentMenu: 'professor',
  activeDetailTab: 'tag',
  currentProfId: null,
  searchKeyword: '',
  selectedDept: '전체',
  selectedGrade: '전체', // 학년 필터 상태 추가
  selectedSearchTag: '', // 메인 화면 태그 필터 상태 추가
  purchasedItemIds: [],
  authTabMode: 'login',
};

// 사전 정의된 핵심 고정 태그 목록
const PREDEFINED_TAGS = [
  '족보그대로',
  '출결빡빡',
  '과제많음',
  '시험어려움',
  '학점짜다',
];

// ==========================================================================
// 💾 2. 모크 데이터베이스 코어
// ==========================================================================
const mockProfessors = [
  {
    id: 101,
    name: '김을지 교수님',
    college: '보건과학대학',
    department: '물리의학학과',
    grade: '2학년', // 개설 학년 정보 매핑
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
    tags: [
      { name: '족보그대로', count: 42 },
      { name: '출결빡빡', count: 18 },
      { name: '과제많음', count: 29 },
      { name: '시험어려움', count: 31 },
      { name: '학점짜다', count: 12 },
    ],
    reviews: [
      {
        id: 1,
        author: '보건과학대학 재학생',
        rating: 5,
        date: '2026.07.11 12:40',
        term: '2026-1학기',
        text: '매 수업 핵심 지표 위주로 쉽게 풀어서 강의해주시며, 질문 피드백 대응이 대단히 명확하십니다.',
        reported: false,
      },
    ],
  },
  {
    id: 102,
    name: '이첨단 교수님',
    college: '첨단융합대학',
    department: '첨단학부',
    grade: '3학년',
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
    tags: [
      { name: '족보그대로', count: 5 },
      { name: '출결빡빡', count: 22 },
      { name: '과제많음', count: 45 },
      { name: '시험어려움', count: 39 },
      { name: '학점짜다', count: 25 },
    ],
    reviews: [
      {
        id: 2,
        author: '첨단학부 3학년',
        rating: 4,
        date: '2026.06.20 18:15',
        term: '2026-1학기',
        text: '과제 설계 장벽은 높지만 핵심 인공지능 엔지니어링 실무 역량을 확실히 기를 수 있습니다.',
        reported: false,
      },
    ],
  },
];

const mockStoreItems = [
  {
    id: 501,
    title: '[김을지 교수] 운열지학학 2025년도 1학기 기말고사 정답 복원 교안집',
    profName: '김을지 교수님',
    cost: 10,
    downloads: 84,
    content:
      '운열지학학 기말고사 기출 서술형 3문항 100% 정밀 복원 및 채점 기준 요약본 파일 본문입니다.',
  },
  {
    id: 502,
    title: '[이첨단 교수] 인공지능 개론 중간고사 족보 가이드라인 및 소스코드',
    profName: '이첨단 교수님',
    cost: 10,
    downloads: 132,
    content:
      '인공지능 개론 중간 코딩 테스트 대비 머신러닝 선형회귀 모델 구현 문제 족보 파일 본문입니다.',
  },
];

// ==========================================================================
// 🔄 3. 라우팅 및 다중 필터 허브
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

  if (menuName === 'professor') {
    searchBlock.style.display = 'block';
    pageHeading.innerText = '전공 교수 체크';
    container.innerHTML = `<div id="professorListWrapper"></div>`;
    renderMainSearchTagBar();
    renderProfessorList();
  } else if (menuName === 'store') {
    searchBlock.style.display = 'block';
    pageHeading.innerText = '비밀 족보 스토어';
    container.innerHTML = `
            <div style="display:flex; justify-content:flex-end; margin-bottom:16px;">
                <button class="action-btn btn-blue" onclick="openStoreModal()"><span class="material-symbols-outlined" style="font-size:16px;">edit_document</span>족보 자료 등록</button>
            </div>
            <div id="storeListWrapper"></div>
        `;
    renderStoreList();
  } else if (menuName === 'mypage') {
    if (!state.isLoggedIn) {
      switchPage('auth');
      return;
    }
    searchBlock.style.display = 'none';
    renderMyPageWorkspace(container);
  } else if (menuName === 'auth') {
    searchBlock.style.display = 'none';
    renderAuthPageLayout(container);
  }
}

// 메인 태그 필터 바 렌더링 함수
function renderMainSearchTagBar() {
  const container = document.getElementById('mainSearchTagBar');
  if (!container) return;

  container.innerHTML = `
        <span style="font-size:12px; font-weight:600; color:var(--text-sub); display:flex; align-items:center; margin-right:6px;">태그 필터:</span>
        <div class="search-tag-chip ${state.selectedSearchTag === '' ? 'selected' : ''}" onclick="handleSearchTagSelect('')">전체</div>
        ${PREDEFINED_TAGS.map(
          (tag) => `
            <div class="search-tag-chip ${state.selectedSearchTag === tag ? 'selected' : ''}" onclick="handleSearchTagSelect('${tag}')">#${tag}</div>
        `,
        ).join('')}
    `;
}

function handleSearchTagSelect(tag) {
  state.selectedSearchTag = tag;
  renderMainSearchTagBar();
  renderProfessorList();
}

function renderProfessorList() {
  const wrapper = document.getElementById('professorListWrapper');
  if (!wrapper) return;
  wrapper.innerHTML = '';

  // 학과, 학년, 입력 검색어, 상단 필터 태그 조건 결합 필터링
  const filtered = mockProfessors.filter((p) => {
    const matchesSearch =
      p.name.includes(state.searchKeyword) ||
      p.subjects.includes(state.searchKeyword);
    const matchesDept =
      state.selectedDept === '전체' || p.department === state.selectedDept;
    const matchesGrade =
      state.selectedGrade === '전체' || p.grade === state.selectedGrade;

    let matchesTag = true;
    if (state.selectedSearchTag !== '') {
      const target = p.tags.find((t) => t.name === state.selectedSearchTag);
      matchesTag = target && target.count > 0; // 해당 태그 투표 수가 있는 경우만 노출
    }

    return matchesSearch && matchesDept && matchesGrade && matchesTag;
  });

  if (filtered.length === 0) {
    wrapper.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:13px; padding:40px 0;">조건에 부합하는 교수님 정보가 존재하지 않습니다.</p>`;
    return;
  }

  filtered.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'item-list-card';
    card.innerHTML = `
            <div>
                <h3 style="font-size:16px; margin-bottom:4px; font-weight:700;">${p.name} <span style="font-size:12px; font-weight:400; color:var(--text-muted); margin-left:6px;">[${p.grade}]</span></h3>
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
                ? `<button class="action-btn" onclick="switchPage('mypage')" style="color:var(--primary-color); border-color:var(--primary-color);">보관함 열람</button>`
                : `<button class="action-btn btn-blue" onclick="purchaseStoreItem(${item.id}, ${item.cost})"><span class="material-symbols-outlined" style="font-size:16px;">lock</span> 열람 (${item.cost}P 차감)</button>`
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

  const topTag = [...p.tags].sort((a, b) => b.count - a.count)[0];

  container.innerHTML = `
        <div class="breadcrumb">교수 검색 &nbsp;/&nbsp; ${p.college} &nbsp;/&nbsp; <span style="color:var(--text-main); font-weight:600;">${p.department} (${p.grade})</span></div>
        <div class="header-action-row">
            <div class="title-area">
                <span class="material-symbols-outlined back-btn" onclick="switchPage('professor')">arrow_back</span>
                <div>
                    <h2 style="font-size: 20px; font-weight: 700;">${p.name}</h2>
                    <p style="font-size: 12px; color: var(--text-muted); margin-top:2px;">${p.college} ${p.department} [${p.grade}] • 담당과목: ${p.subjects}</p>
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
                <div class="summary-card-title">주요 대표 특성 키워드</div>
                <div style="margin-top:14px;">
                    <span class="tag-pill clicked" style="margin-bottom:0;"><span class="badge-idx">TOP</span>#${topTag.name} (${topTag.count}표)</span>
                </div>
            </div>
        </div>

        <div class="tabs-header">
            <div class="tab-item ${state.activeDetailTab === 'tag' ? 'active' : ''}" onclick="switchDetailTab('tag')">태그 피드백</div>
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
// 📄 5. 비즈니스 경제 룰 인프라 (포인트 증감 명세화 및 태그 선택 기능)
// ==========================================================================
function renderTabPanelContent(prof) {
  const block = document.getElementById('tabContentBlock');
  if (!block) return;

  if (state.activeDetailTab === 'tag') {
    block.innerHTML = `
            <div style="background:#fff; border:1px solid var(--border-color); border-radius:12px; padding:24px;">
                <h4 style="font-size:14px; font-weight:700; margin-bottom:6px; color:var(--text-main);">클릭형 강의 특성 투표</h4>
                <p style="font-size:12px; color:var(--text-muted); margin-bottom:18px;">공감하는 태그를 클릭하면 수치가 1 상승하며 <span style="color:var(--primary-color); font-weight:600;">활동 포인트 2점</span>이 적립됩니다. (중복 불가)</p>
                <div style="display:flex; flex-wrap:wrap;" id="tagPillContainer">
                    ${prof.tags
                      .map((tag) => {
                        const uniqueKey = `${prof.id}_${tag.name}`;
                        const isAlreadyClicked =
                          state.isLoggedIn &&
                          state.user.clickedTags &&
                          state.user.clickedTags.includes(uniqueKey);
                        return `
                            <div class="tag-pill ${isAlreadyClicked ? 'clicked' : ''}" onclick="handleTagClickAction('${tag.name}')">
                                <span class="badge-idx">${tag.count}</span> #${tag.name}
                            </div>
                        `;
                      })
                      .join('')}
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
                    <div class="review-row-item" style="${r.reported ? 'opacity:0.5;' : ''}">
                        <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:12px;">
                            <span style="font-weight:700;">${r.author} <span style="color:var(--primary-color); margin-left:4px;">★ ${r.rating}</span></span>
                            <div style="display:flex; align-items:center; gap:12px; color:var(--text-muted);">
                                <span>${r.date}</span>
                                ${r.reported ? `<span style="color:var(--danger-color); font-weight:600;">[신고 접수]</span>` : `<span style="cursor:pointer;" onclick="reportReviewAction(${r.id})">신고</span>`}
                            </div>
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

// 태그 선택/클릭 액션 (+2포인트 충전 구조)
function handleTagClickAction(tagName) {
  if (!state.isLoggedIn) return;
  const p = mockProfessors.find((item) => item.id === state.currentProfId);
  if (!p) return;

  if (!state.user.clickedTags) state.user.clickedTags = [];
  const uniqueKey = `${p.id}_${tagName}`;

  if (state.user.clickedTags.includes(uniqueKey)) {
    alert('이미 이 교수님의 해당 태그에 피드백을 반영하셨습니다.');
    return;
  }

  const targetTag = p.tags.find((t) => t.name === tagName);
  if (targetTag) {
    targetTag.count += 1;
    state.user.points += 2; // 규칙 반영: 태그 선택시 +2포인트 적립
    state.user.clickedTags.push(uniqueKey);
    updateSidebarProfileUI();
    alert(`🎉 #${tagName} 반영 완료! +2포인트가 적립되었습니다.`);
    viewProfessorDetail(p.id);
  }
}

function purchaseStoreItem(itemId, cost) {
  if (!state.isLoggedIn) {
    alert('학적 로그인 연동 후 다운로드가 가능합니다.');
    switchPage('auth');
    return;
  }
  if (!state.user.isCertified) {
    alert('마이페이지에서 수강확인서 등본 인증 완료 후 열람할 수 있습니다.');
    switchPage('mypage');
    return;
  }
  if (state.user.points < cost) {
    alert(
      `포인트가 부족합니다. (현재 보유: ${state.user.points}P / 필요: ${cost}P)\n태그 피드백 투표(+2P) 및 후기 작성(+3P)을 병행하여 5포인트를 빠르게 모아보세요!`,
    );
    return;
  }

  if (
    confirm(`해당 비밀 족보를 오픈하기 위해 ${cost}포인트를 차감 전송할까요?`)
  ) {
    state.user.points -= cost; // 규칙 반영: 족보 열람 시 -10포인트 차감
    state.purchasedItemIds.push(itemId);
    updateSidebarProfileUI();
    alert(
      '🎉 열람 권한이 승인되었습니다. 마이페이지 보관함에서 원문을 체크하세요!',
    );
    renderStoreList();
  }
}

function openReviewModal() {
  if (!state.isLoggedIn) {
    alert('로그인 후 작성이 허용됩니다.');
    switchPage('auth');
    return;
  }
  if (!state.user.isCertified) {
    alert('수강 확인서가 등록된 상태여야 리뷰 작성이 진행됩니다.');
    switchPage('mypage');
    return;
  }
  openModal('reviewModal');
}

function submitReviewAction() {
  const p = mockProfessors.find((item) => item.id === state.currentProfId);
  const textVal = document.getElementById('revText').value;
  if (textVal.length < 10) {
    alert('성의 있는 리뷰를 위해 최소 10자 이상 적어주세요.');
    return;
  }

  p.reviews.unshift({
    id: Date.now(),
    author: `${state.user.dept} ${state.user.grade || '학우'}`,
    rating: parseFloat(document.getElementById('revRating').value),
    date: '2026.07.11 13:05',
    term: document.getElementById('revTerm').value,
    text: textVal,
    reported: false,
  });

  state.user.points += 3; // 규칙 반영: 후기 작성 시 +3포인트 적립
  updateSidebarProfileUI();
  closeModal('reviewModal');
  alert(
    '📢 소중한 강의 후기가 반영되었습니다! +3포인트가 적립되었습니다.\n(태그 투표+2P와 후기 작성+3P를 통합하여 총 5포인트 완벽 획득 가능)',
  );
  viewProfessorDetail(p.id);
}

// ==========================================================================
// 🔐 6. 회원가입 및 학과/학년 선택 폼 처리 구조
// ==========================================================================
function renderAuthPageLayout(container) {
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
    // 학과선택 및 학년 선택 옵션 컴포넌트 추가
    formBlock.innerHTML = `
            <div class="form-group">
                <label>성명</label>
                <input type="text" id="regName" class="form-control" placeholder="홍길동">
            </div>
            <div class="form-group">
                <label>학과 선택</label>
                <select id="regDept" class="form-control">
                    <option value="물리의학학과">물리의학학과</option>
                    <option value="첨단학부">첨단학부</option>
                    <option value="간호학과">간호학과</option>
                    <option value="임상병리학과">임상병리학과</option>
                </select>
            </div>
            <div class="form-group">
                <label>학년 선택</label>
                <select id="regGrade" class="form-control">
                    <option value="1학년">1학년</option>
                    <option value="2학년">2학년</option>
                    <option value="3학년">3학년</option>
                    <option value="4학년">4학년</option>
                </select>
            </div>
            <div class="form-group">
                <label>을지대학교 공식 이메일</label>
                <input type="text" id="regEmail" class="form-control" placeholder="student@eulji.ac.kr">
            </div>
            <div class="form-group" style="margin-bottom:24px;">
                <label>비밀번호</label>
                <input type="password" id="regPassword" class="form-control" placeholder="••••••">
            </div>
            <button class="action-btn btn-blue" style="width:100%; padding:12px; justify-content:center; font-weight:600;" onclick="executeRegisterAction()">회원가입 완료 (+20점 기본 지급)</button>
        `;
  }
}

function toggleAuthMode(mode) {
  state.authTabMode = mode;
  renderAuthPageLayout(document.getElementById('mainContentContainer'));
}

function executeLoginAction() {
  state.isLoggedIn = true;
  state.user = {
    name: '김을지',
    dept: '물리의학학과',
    grade: '3학년',
    points: 20,
    isCertified: true,
    certifiedFile: '확인서.pdf',
    clickedTags: [],
  };
  updateSidebarProfileUI();
  alert('🎉 포털 통합 연동 성공! 기본 20포인트가 로드되었습니다.');
  switchPage('professor');
}

function executeRegisterAction() {
  const name = document.getElementById('regName').value || '신규회원';
  const dept = document.getElementById('regDept').value;
  const grade = document.getElementById('regGrade').value;

  state.isLoggedIn = true;
  state.user = {
    name: name,
    dept: dept,
    grade: grade,
    points: 20,
    isCertified: false,
    certifiedFile: null,
    clickedTags: [],
  }; // 규칙 반영: 가입 시 20포인트 지급
  updateSidebarProfileUI();
  alert(
    `🎉 강의라운지 가입을 축하합니다!\n기본 가입 축하금 [20포인트]가 정상 지급되었습니다.`,
  );
  switchPage('professor');
}

// ==========================================================================
// 👤 7. 마이페이지 워크스페이스 및 내부 보관함 구조
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
                    <p style="font-size:12px; color:var(--text-muted); font-weight:500;">포털 소속 학적 정보</p>
                    <h2 style="font-size:18px; font-weight:700; margin-top:4px; margin-bottom:16px;">
                        ${state.user.name} <span style="font-size:13px; font-weight:400; color:var(--text-sub);">${state.user.dept} (${state.user.grade})</span>
                    </h2>
                    <div style="padding:16px; background:var(--bg-main); border-radius:10px; display:flex; justify-content:space-between; align-items:center; border:1px solid var(--border-color);">
                        <span style="font-size:13px; color:var(--text-sub);">현재 가용 보충 포인트</span>
                        <strong style="color:var(--primary-color); font-size:18px; font-weight:800;">${state.user.points} P</strong>
                    </div>
                </div>

                <div style="background:#fff; border:1px solid var(--border-color); border-radius:16px; padding:28px;">
                    <h3 style="font-size:14px; font-weight:700; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
                        <span class="material-symbols-outlined" style="color:var(--primary-color); font-size:20px;">verified_user</span>수강 확인서 서류 연동 인증
                    </h3>
                    <p style="font-size:12px; color:var(--text-sub); margin-bottom:16px; line-height:1.4;">
                        정확한 정보 교류 신뢰성을 기하기 위해 포털 수강확인서 캡처 서류 등록이 최초 1회 필수 요구됩니다.
                    </p>
                    <div class="file-upload-dropzone" onclick="triggerHiddenFileInput()">
                        <span class="material-symbols-outlined" style="font-size:32px; color:var(--text-muted);">cloud_upload</span>
                        <p style="font-size:12px; margin-top:6px; color:var(--text-sub);">수강 확인서 등록 (클릭)</p>
                        <input type="file" id="hiddenAuthFileInput" style="display:none;" onchange="handleAuthFileSelection(this)">
                    </div>
                    <div id="authFileUploadBadgeArea">
                        ${state.user.isCertified ? `<div class="file-uploaded-badge">✓ 증명서류 승인 완료 (제한 해제)</div>` : ''}
                    </div>
                </div>
            </div>

            <div style="background:#fff; border:1px solid var(--border-color); border-radius:16px; padding:28px;">
                <h3 style="font-size:14px; font-weight:700; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                    <span class="material-symbols-outlined" style="color:orange; font-size:20px;">folder_open</span>기출 족보 보관함 (-10P 차감 내역)
                </h3>
                <p style="font-size:11px; color:var(--text-muted); margin-bottom:20px;">무임승차 방지를 통과한 정회원 열람 기출 텍스트입니다.</p>
                <div id="mypagePurchasedContainer">
                    ${
                      purchasedObjects.length === 0
                        ? `
                        <p style="color:var(--text-muted); text-align:center; font-size:12px; padding:30px;">결제 오픈된 비밀 족보 이력이 존재하지 않습니다.</p>
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

// ==========================================================================
// 🎨 8. 시각화 및 부가 유틸리티 처리기
// ==========================================================================
function drawRadarChart5Axis(metrics) {
  const canvas = document.getElementById('radarChartCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2,
    centerY = canvas.height / 2,
    maxRadius = 75;
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
            <div class="bar-chart-info"><span>${item.label}</span><strong>${item.val.toFixed(1)} / 5.0</strong></div>
            <div class="bar-chart-bg"><div class="bar-chart-fill" id="coreBarFill_${i}"></div></div>
        </div>
    `,
    )
    .join('');
  setTimeout(() => {
    arr.forEach((item, i) => {
      document.getElementById(`coreBarFill_${i}`).style.width =
        `${(item.val / 5) * 100}%`;
    });
  }, 50);
}

function reportReviewAction(reviewId) {
  const p = mockProfessors.find((item) => item.id === state.currentProfId);
  if (!p) return;
  const r = p.reviews.find((rev) => rev.id === reviewId);
  if (r) {
    r.reported = true;
    alert('신고가 정상 접수되었습니다.');
    viewProfessorDetail(p.id);
  }
}
function triggerHiddenFileInput() {
  document.getElementById('hiddenAuthFileInput').click();
}
function handleAuthFileSelection(input) {
  if (!input.files.length) return;
  state.user.isCertified = true;
  alert('수강인증 확인 서류가 정상 접수 및 승인처리 되었습니다!');
  switchPage('mypage');
}
function openStoreModal() {
  if (!state.isLoggedIn) {
    alert('로그인 후 이용 가능합니다.');
    switchPage('auth');
    return;
  }
  document.getElementById('storeProfSelect').innerHTML = mockProfessors
    .map((p) => `<option value="${p.id}">${p.name} (${p.department})</option>`)
    .join('');
  openModal('storeModal');
}
function submitStoreItemAction() {
  const title = document.getElementById('storeTitle').value;
  const content = document.getElementById('storeContent').value;
  if (!title || !content) {
    alert('내용을 채워주세요.');
    return;
  }
  mockStoreItems.unshift({
    id: Date.now(),
    title: title,
    profName: mockProfessors.find(
      (p) =>
        p.id === parseInt(document.getElementById('storeProfSelect').value),
    ).name,
    cost: 10,
    downloads: 0,
    content: content,
  });
  closeModal('storeModal');
  alert('텍스트 족보가 정상 공유 등록되었습니다.');
  renderStoreList();
}
function executeLogout() {
  if (confirm('로그아웃 하시겠습니까?')) {
    state.isLoggedIn = false;
    state.user = null;
    state.purchasedItemIds = [];
    updateSidebarProfileUI();
    switchPage('professor');
  }
}
function openModal(id) {
  document.getElementById(id).style.display = 'flex';
}
function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}
function handleLiveSearch() {
  state.searchKeyword = document.getElementById('globalSearchInput').value;
  renderProfessorList();
}
function handleFilterChange() {
  state.selectedDept = document.getElementById('deptFilter').value;
  state.selectedGrade = document.getElementById('gradeFilter').value;
  renderProfessorList();
}
function updateSidebarProfileUI() {
  const card = document.getElementById('sidebarProfile');
  const logoutBtn = document.getElementById('sidebarLogoutBtn');
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
