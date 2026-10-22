// Many specialist clinics are named after their director: "김소영피부과의원", "연세신효선성형외과의원".
// This reads that name when the clinic name is exactly [optional prefix][surname + 2 syllables][specialty]
// and both given-name syllables are ones that commonly appear in Korean given names. That last check
// is what separates real names from brands that start with a surname ("오렌지", "이미지", "유레카").

const SURNAMES = '김이박최정강조윤장임한오서신권황안송류전홍고문양손배백허유남심노하곽성차주우구민진나지엄채원천방공현함변염여추도소석선설마길연위표명기반왕금옥육인맹제모탁국어은편용예봉경사부';
const PREFIXES = '강남|압구정|청담|신사|논현|서초|잠실|명동|신촌|홍대|목동|노원|건대|연세|서울|고려|이대|가톨릭|경희|한양|중앙|성균관|서울대';
const PATTERN = new RegExp(`^(?:${PREFIXES})?([${SURNAMES}])([가-힣])([가-힣])(?:피부과|성형외과)(?:의원)?$`);

// Syllables common in Korean given names (from director names collected on clinic homepages plus the
// usual naming syllables). Brand-like syllables such as 렌, 레, 카, 델, 셀, 디, 앤 are deliberately absent.
const GIVEN = new Set((
    '가각간갑강개건걸겸경계고곤공관광교구국군권규균근금기길나낙난남내녀년노누눈늘능다단달담당대덕도돈동두득들라란람랑래량련렬렴령례로록뢰룡룬률륜르름릉리린림립' +
    '만말매맹면명모목몽무문미민바박반발방배백범법벽변병보복본봉부분비빈빛사삭산삼상새생서석선설섬섭성세소속손솔송수숙순술숭슬승시식신실심아악안암애야약양어언엄업여역연열' +
    '염엽영예오옥온올완왕외요욱운울웅원월위유육윤율융은을음읍응의이익인일임입자작잔장재정제조종주준중지직진질집징차찬창채천철청초총추축춘충취치칠탁탄태택토통퇴파판' +
    '팔패평포표품풍필하학한함항해행향허헌혁현협형혜호혼홍화확환활황회효후훈휘휴흠흥희'
).split(''));
// Syllable pairs that are almost always words or brands, not given names
const NOT_GIVEN = new Set(['미지', '렌지', '레카', '델로', '마이', '이디', '세상', '다운', '름다', '라클', '지함', '은결', '나무', '하늘', '사랑', '마음', '보라', '바다', '노을', '해피', '라인', '스킨', '케어']);

// Brand openings that look like surname + syllable: "제이(J)…", "서울…", "연세…", "은하수", "함박눈"
const BRAND_STARTS = ['제이', '제로', '서울', '연세', '신사', '은하', '함박', '우아', '오르', '오아', '모나', '어바', '어수', '예지', '성경', '이화', '고운', '정다', '한빛', '나비'];

function nameFromClinic(clinicName) {
    const m = String(clinicName || '').replace(/\s+/g, '').match(PATTERN);
    if (!m) return null;
    const [, surname, first, second] = m;
    if (BRAND_STARTS.includes(surname + first)) return null;
    // "강남준성형외과" reads as 강남 + 준, not a person named 강남준
    if (PREFIXES.split('|').some(prefix => (surname + first + second).startsWith(prefix))) return null;
    if (!GIVEN.has(first) || !GIVEN.has(second) || NOT_GIVEN.has(first + second)) return null;
    return surname + first + second;
}

module.exports = { nameFromClinic };
