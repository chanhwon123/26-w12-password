// src/App.jsx
import { useState } from 'react';
import { evaluatePasswordStrength, generatePassword, checkPwnedPassword } from './utils/passwordSecurity';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
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

  // 다크모드 / 라이트모드 색상 테마
  const theme = {
    bg: isDarkMode ? '#121212' : '#ffffff',
    text: isDarkMode ? '#e0e0e0' : '#333333',
    cardBg: isDarkMode ? '#1e1e1e' : '#f5f5f5',
    cardBorder: isDarkMode ? '#333333' : '#ddd',
    inputBg: isDarkMode ? '#2d2d2d' : '#ffffff',
    inputText: isDarkMode ? '#ffffff' : '#000000',
    inputBorder: isDarkMode ? '#444444' : '#ccc',
    buttonBg: isDarkMode ? '#3b82f6' : '#007bff',
    buttonText: '#ffffff',
    resultSuccessBg: isDarkMode ? '#1b382b' : '#f0fff0',
    resultDangerBg: isDarkMode ? '#3a1e1e' : '#fff0f0',
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.bg,
      color: theme.text,
      transition: 'background-color 0.3s, color 0.3s',
      padding: '40px 20px',
      boxSizing: 'border-box',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        
        {/* 상단 헤더 & 테마 토글 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '24px' }}>🛡️ 비밀번호 보안 대시보드</h1>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              padding: '8px 14px',
              borderRadius: '20px',
              border: `1px solid ${theme.inputBorder}`,
              background: theme.cardBg,
              color: theme.text,
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isDarkMode ? '☀️ 라이트모드' : '🌙 다크모드'}
          </button>
        </div>

        {/* 1. 생성기 */}
        <section style={{ 
          background: theme.cardBg, 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: `1px solid ${theme.cardBorder}`
        }}>
          <h2 style={{ marginTop: 0, fontSize: '18px' }}>🎲 안전한 비밀번호 생성기 (crypto.getRandomValues)</h2>
          <div style={{ marginBottom: '10px' }}>
            <label>길이 ({genLength}자): </label>
            <input 
              type="range" min="8" max="32" value={genLength} 
              onChange={(e) => setGenLength(e.target.value)} 
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <label><input type="checkbox" checked={options.upper} onChange={(e) => setOptions({...options, upper: e.target.checked})} /> 대문자</label>
            <label><input type="checkbox" checked={options.lower} onChange={(e) => setOptions({...options, lower: e.target.checked})} /> 소문자</label>
            <label><input type="checkbox" checked={options.digits} onChange={(e) => setOptions({...options, digits: e.target.checked})} /> 숫자</label>
            <label><input type="checkbox" checked={options.symbols} onChange={(e) => setOptions({...options, symbols: e.target.checked})} /> 특수문자</label>
          </div>
          <button 
            onClick={handleGenerate} 
            style={{ 
              padding: '10px 16px', 
              background: theme.buttonBg, 
              color: theme.buttonText, 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            비밀번호 생성
          </button>
        </section>

        {/* 2. 입력 및 강도 검사 */}
        <section style={{ 
          background: theme.cardBg, 
          border: `1px solid ${theme.cardBorder}`, 
          padding: '16px', 
          borderRadius: '8px' 
        }}>
          <h2 style={{ marginTop: 0, fontSize: '18px' }}>🔍 강도 검사 &amp; k-익명성 유출 확인</h2>
          <input
            type="text"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setCheckResult(null); }}
            placeholder="비밀번호 입력 또는 생성"
            style={{ 
              width: '100%', 
              padding: '10px', 
              fontSize: '16px', 
              boxSizing: 'border-box', 
              marginBottom: '10px',
              backgroundColor: theme.inputBg,
              color: theme.inputText,
              border: `1px solid ${theme.inputBorder}`,
              borderRadius: '4px'
            }}
          />
          
          <div>
            <strong>강도: </strong> 
            <span style={{ fontWeight: 'bold', color: strength.score >= 4 ? '#4caf50' : strength.score >= 2 ? '#ff9800' : '#f44336' }}>
              {strength.label} ({strength.score} / 5점)
            </span>
            {strength.reasons.length > 0 && (
              <ul style={{ color: isDarkMode ? '#aaa' : '#666', fontSize: '14px', marginTop: '6px' }}>
                {strength.reasons.map((r, idx) => <li key={idx}>{r}</li>)}
              </ul>
            )}
          </div>

          <button 
            onClick={handlePwnedCheck} 
            disabled={!password || loading}
            style={{ 
              marginTop: '15px', 
              padding: '12px', 
              width: '100%', 
              background: !password || loading ? '#888' : theme.buttonBg, 
              color: theme.buttonText, 
              border: 'none', 
              borderRadius: '4px', 
              cursor: !password || loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'k-익명성 범위 조회 중...' : '유출 여부 확인 (앞 5글자만 전송)'}
          </button>

          {errorMsg && <p style={{ color: '#f44336' }}>{errorMsg}</p>}

          {checkResult && (
            <div style={{ 
              marginTop: '15px', 
              padding: '12px', 
              background: checkResult.pwned ? theme.resultDangerBg : theme.resultSuccessBg, 
              borderRadius: '6px',
              border: `1px solid ${checkResult.pwned ? '#f44336' : '#4caf50'}`
            }}>
              <h3 style={{ margin: '0 0 8px 0', color: checkResult.pwned ? '#f44336' : '#4caf50', fontSize: '16px' }}>
                {checkResult.pwned ? `⚠️ 위험! 유출 횟수 ${checkResult.count.toLocaleString()}회` : '✅ 안전! 알려진 유출 기록 없음'}
              </h3>
              <p style={{ fontSize: '13px', opacity: 0.8, margin: 0 }}>
                🔒 <strong>최소 전송 원칙 (k-익명성)</strong><br />
                전송된 URL: <code>{checkResult.endpoint}</code>
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}