import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { PortraitMark } from './PersonalElements';
import { personAccent } from '../../shared/accents.js';
import { friendAction, readPeople } from '../utils/people';
import { getIdentityToken } from '../utils/identity';

function parseCode(value) {
  const fromLink = value.trim().match(/#invite\/([a-fA-F0-9-]{12,16})/)?.[1];
  return (fromLink || value).replaceAll(/[^a-fA-F0-9]/g, '').trim().toUpperCase();
}

// 添加朋友是「我的好友码」的另一半，直接摆在页面上，不再藏进弹窗。
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
  return <div className="pp-finder">
    <form onSubmit={lookup}>
      <input aria-label="朋友的好友码或邀请链接" value={code} disabled={busy}
        onChange={(e) => { setCode(e.target.value); setPerson(null); setSent(false); }}
        autoCapitalize="off" autoComplete="off" spellCheck={false} placeholder="粘贴好友码或邀请链接" required />
      <button className="pp-outline" disabled={busy || !code.trim()}>{busy ? '查找中…' : '查找'}<ArrowRight size={14} /></button>
    </form>
    {!person && !message && <p className="pp-finder-hint">12 位好友码，或整条邀请链接，都可以。</p>}
    {person && <div className="pp-found">
      <div className="pp-found-person"><PortraitMark color={personAccent(person)} /><div><h3>{person.nickname || '还没起名字'}</h3><p>{person.bio || '还没写介绍。'}</p></div></div>
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
      {sent && <p className="pp-finder-done"><Check size={13} />已送出</p>}
    </div>}
    {message && <p role="status" className="pp-status">{message}</p>}
  </div>;
}
