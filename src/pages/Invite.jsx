import { ArrowLeft, ArrowRight } from 'lucide-react';
import FriendFinder from '../components/FriendFinder';
import './Personal.css';

export default function Invite({ code, account, onBack, onCreate, onFriends }) {
  return <div className="personal-space"><div className="pp-page pp-narrow">
    <header className="pp-header"><button className="pp-text-button" onClick={onBack}><ArrowLeft size={16} />回到 Blur</button><span className="pp-brand">blur</span></header>
    <section className="pp-create"><p className="pp-eyebrow">一个好友邀请</p><h1>在这里，也能找到彼此。</h1>
      {account.registered ? <><FriendFinder key={account.id} initialCode={code} /><button className="pp-text-button pp-spaced" onClick={onFriends}>查看好友<ArrowRight size={14} /></button></>
        : <><p className="pp-dialog-description">先把身份存到云端，或恢复已有身份，再确认是哪位朋友。原有的本机画像会保留。</p><button className="pp-primary" onClick={onCreate}>存到云端或恢复身份<ArrowRight size={15} /></button></>}
    </section>
  </div></div>;
}
