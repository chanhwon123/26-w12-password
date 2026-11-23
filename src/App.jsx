import { useState } from 'react';
import { evaluatePasswordStrength, generatePassword, checkPwnedPassword } from './utils/passwordSecurity';

export default function App() {
  const [password, setPassword] = useState('');
  const [genLength, setGenLength] = useState(16);
  const [options, setOptions] = useState({ upper: true, lower: true, digits: true, symbols: true });
  const [checkResult, setCheckResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const strength = evaluatePasswordStrength(password);

  const handleGenerate = () => {
    const newPass = generatePassword({ length: Number(genLength), ...options });
    setPassword(newPass);
    setCheckResult(null);
  };

  const handlePwnedCheck = async () => {
    if (!password) return;
    setLoading(true);
    setErrorMsg('');
    setCheckResult(null);

    try {
      const res = await checkPwnedPassword(password);
      setCheckResult(res);
    } catch (err) {
      setErrorMsg(err.message || '조회 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '40px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>
      <h1>비밀번호 보안 대시보드</h1>

      <section style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>안전한 비밀번호 생성기 (crypto.getRandomValues)</h2>
        <div style={{ marginBottom: '10px' }}>
          <label>길이 ({genLength}자): </label>
          <input
            type="range"
            min="8"
            max="32"
            value={genLength}
            onChange={(e) => setGenLength(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <label><input type="checkbox" checked={options.upper} onChange={(e) => setOptions({ ...options, upper: e.target.checked })} /> 대문자</label>
          <label><input type="checkbox" checked={options.lower} onChange={(e) => setOptions({ ...options, lower: e.target.checked })} /> 소문자</label>
          <label><input type="checkbox" checked={options.digits} onChange={(e) => setOptions({ ...options, digits: e.target.checked })} /> 숫자</label>
          <label><input type="checkbox" checked={options.symbols} onChange={(e) => setOptions({ ...options, symbols: e.target.checked })} /> 특수문자</label>
        </div>
        <button onClick={handleGenerate} style={{ padding: '8px 16px', cursor: 'pointer' }}>비밀번호 생성</button>
      </section>

      <section style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px' }}>
        <h2>강도 검사 &amp; k-익명성 유출 확인</h2>
        <input
          type="text"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setCheckResult(null); }}
          placeholder="비밀번호 입력 또는 생성"
          style={{ width: '100%', padding: '10px', fontSize: '16px', boxSizing: 'border-box', marginBottom: '10px' }}
        />

        <div>
          <strong>강도: </strong>
          <span style={{ fontWeight: 'bold', color: strength.score >= 4 ? 'green' : strength.score >= 2 ? 'orange' : 'red' }}>
            {strength.label} ({strength.score}/5)
          </span>
          {strength.reasons.length > 0 && (
            <ul style={{ color: '#666', fontSize: '14px' }}>
              {strength.reasons.map((r, idx) => <li key={idx}>{r}</li>)}
            </ul>
          )}
        </div>

        <button
          onClick={handlePwnedCheck}
          disabled={!password || loading}
          style={{ marginTop: '14px', padding: '10px 20px', cursor: 'pointer', width: '100%' }}
        >
          {loading ? '조회 중...' : '유출 여부 확인 (앞 5글자만 전송)'}
        </button>

        {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}

        {checkResult && (
          <div style={{ marginTop: '14px', padding: '12px', background: checkResult.pwned ? '#fff0f0' : '#f0fff0', borderRadius: '6px' }}>
            <h3 style={{ margin: '0 0 6px 0', color: checkResult.pwned ? 'red' : 'green' }}>
              {checkResult.pwned ? `유출됨 (${checkResult.count.toLocaleString()}회)` : '유출 기록 없음'}
            </h3>
            <p style={{ fontSize: '13px', color: '#555', margin: 0 }}>
              요청 주소: <code>{checkResult.endpoint}</code>
            </p>
          </div>
        )}
      </section>
    </div>
  );
}