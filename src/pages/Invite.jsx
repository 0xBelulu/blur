import { ArrowLeft, ArrowRight } from 'lucide-react';
import AtmosphereField from '../components/AtmosphereField';
import FriendFinder from '../components/FriendFinder';
import './Personal.css';

export default function Invite({ code, account, onBack, onCreate, onFriends }) {
  return <div className="personal-space"><AtmosphereField intensity={0.34} /><div className="pp-page pp-narrow">
    <header className="pp-header"><button className="pp-text-button" onClick={onBack}><ArrowLeft size={16} />回到 Blur</button><span className="pp-brand">blur</span></header>
    <section className="pp-create"><p className="pp-eyebrow">一个好友邀请</p><h1>在这里，也能找到彼此。</h1>
      {account.registered ? <><FriendFinder key={account.id} initialCode={code} /><button className="pp-text-button pp-spaced" onClick={onFriends}>查看好友与申请<ArrowRight size={14} /></button></>
        : <><p className="pp-dialog-description">先创建或恢复你的身份，再确认是哪位朋友。原有的本机画像会保留。</p><button className="pp-primary" onClick={onCreate}>创建或恢复身份<ArrowRight size={15} /></button></>}
    </section>
  </div></div>;
}
