import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { friendAction, readPeople } from '../utils/people';
import { getIdentityToken } from '../utils/identity';

function parseCode(value) {
  const fromLink = value.trim().match(/#invite\/([a-fA-F0-9]{12})$/)?.[1];
  return (fromLink || value).replaceAll('-', '').trim().toUpperCase();
}

export default function FriendFinder({ initialCode = '', onChanged }) {
  const [code, setCode] = useState(initialCode);
  const [person, setPerson] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const lookup = async (event) => {
    event.preventDefault(); setBusy(true); setMessage(''); setPerson(null); setSent(false);
    try {
      const clean = parseCode(code);
      if (!/^[A-F0-9]{12}$/.test(clean)) throw new Error('输入 12 位好友码，或粘贴完整的邀请链接');
      setPerson({ ...await readPeople(`/people/by-code/${clean}`), friendCode: clean });
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };
  return <div>
    <form onSubmit={lookup}>
      <label>朋友的好友码或邀请链接<input value={code} disabled={busy} onChange={(e) => { setCode(e.target.value); setPerson(null); setSent(false); }} autoCapitalize="off" autoComplete="off" spellCheck={false} placeholder="例如 ABCD-EF01-2345" required /></label>
      <button className="pp-outline" disabled={busy || !code.trim()}>{busy ? '正在查找…' : '看看是谁'}<ArrowRight size={14} /></button>
    </form>
    {person && <div className="pp-found"><h3>{person.nickname || '还没起名字'}</h3><p>{person.bio || '还没写介绍。'}</p>
      {!sent && <button className="pp-primary" disabled={busy} onClick={async () => {
        const token = getIdentityToken(); setBusy(true); setMessage('');
        try {
          const result = await friendAction('/friends', 'POST', { publicId: person.publicId, friendCode: person.friendCode });
          if (token !== getIdentityToken()) return;
          setSent(true); setMessage(result.status === 'accepted' ? '你们已经是好友了。可以去看看 ta 展示的画像。' : result.direction === 'incoming' ? '对方也发来了申请，在好友列表中接受就好。' : '对方开启了好友确认，申请已送出。');
          onChanged?.();
        } catch (error) { setMessage(error.message); }
        finally { setBusy(false); }
      }}>{person.requireFriendApproval ? '发出好友申请' : '添加为好友'}<ArrowRight size={14} /></button>}
      {sent && <span className="pp-text-button"><Check size={14} />已确认</span>}
    </div>}
    {message && <p role="status" className="pp-status">{message}</p>}
    <p className="pp-helper">好友码和邀请链接就是朋友留给你的邀请。默认直接成为好友；如果对方开启了好友确认，则需要等待回应。彼此只能看到主动展示的画像。</p>
  </div>;
}
