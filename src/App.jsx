import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Landing from './pages/Landing';
import Test from './pages/Test';
import Loading from './pages/Loading';
import Result from './pages/Result';
import About from './pages/About';
import Archetypes from './pages/Archetypes';
import Traits from './pages/Traits';
import Questions from './pages/Questions';
import My from './pages/My';
import SharedProfile from './pages/SharedProfile';
import { generateResult } from './utils/blurEngine';
import { questions } from './data/questions';
import { getHistoryRecords, getAllHistoryRecords, saveHistoryRecord, removeLocalRecord } from './utils/historyStorage';
import { flushPending, refreshCloudHistory, downloadRecord } from './utils/cloud';
import { getAccountInfo, ensureLocalIdentity } from './utils/identity';

const LOADING_DURATION = 3500;
const pages = ['landing', 'about', 'archetypes', 'traits', 'questions', 'me', 'test', 'loading', 'result', 'view', 'compare'];

function readRoute() {
  const [screen, id] = window.location.hash.slice(1).split('/');
  if (['view', 'compare'].includes(screen)) {
    return /^[a-f0-9]{32}$/.test(id || '') ? { screen, id } : { screen: 'landing' };
  }
  if (screen === 'result') return getHistoryRecords().some((record) => record.id === id && record.localPresent)
    ? { screen, id } : { screen: 'me' };
  if (screen === 'history') return { screen: 'me' };
  return { screen: ['about', 'archetypes', 'traits', 'questions', 'me'].includes(screen) ? screen : 'landing' };
}

const pageVariants = {
  enter: (direction) => ({ opacity: 0, x: direction > 0 ? 60 : -60, scale: 0.97, filter: 'blur(2px)' }),
  center: { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' },
  exit: (direction) => ({ opacity: 0, x: direction > 0 ? -60 : 60, scale: 0.97, filter: 'blur(2px)' }),
};

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const [direction, setDirection] = useState(1);
  const [records, setRecords] = useState(getHistoryRecords);
  const [account, setAccount] = useState(getAccountInfo);
  const [unsavedResult, setUnsavedResult] = useState(null);
  const [notice, setNotice] = useState('');
  const [peer, setPeer] = useState(null);
  const [comparisonRecordId, setComparisonRecordId] = useState(null);
  const loadingTimer = useRef(null);
  const comparisonTarget = useRef(null);

  const navigate = useCallback((screen, id) => {
    setDirection(pages.indexOf(screen) > pages.indexOf(route.screen) ? 1 : -1);
    setRoute({ screen, id });
    window.history.pushState(null, '', screen === 'landing'
      ? window.location.pathname + window.location.search : `#${screen}${id ? `/${id}` : ''}`);
  }, [route.screen]);

  useEffect(() => {
    const changed = () => { setRecords(getHistoryRecords()); setAccount(getAccountInfo()); };
    const back = () => {
      clearTimeout(loadingTimer.current);
      setRoute(readRoute());
    };
    window.addEventListener('blur-history-change', changed);
    window.addEventListener('blur-account-change', changed);
    window.addEventListener('storage', changed);
    window.addEventListener('popstate', back);
    window.addEventListener('hashchange', back);
    return () => {
      clearTimeout(loadingTimer.current);
      window.removeEventListener('blur-history-change', changed);
      window.removeEventListener('blur-account-change', changed);
      window.removeEventListener('storage', changed);
      window.removeEventListener('popstate', back);
      window.removeEventListener('hashchange', back);
    };
  }, []);

  useEffect(() => {
    if (route.screen !== 'me') return;
    let active = true;
    ensureLocalIdentity().then(refreshCloudHistory).then(() => { if (active) setNotice(''); })
      .catch(() => { if (active) setNotice('暂时无法核实云端状态。新画像仍只保存在本机，不会自动上传。'); });
    return () => { active = false; };
  }, [route.screen]);

  const home = () => {
    clearTimeout(loadingTimer.current);
    comparisonTarget.current = null;
    navigate('landing');
  };

  const start = (shareId = null) => {
    comparisonTarget.current = shareId;
    setComparisonRecordId(null);
    setUnsavedResult(null);
    navigate('test');
  };

  const complete = (answers) => {
    navigate('loading');
    clearTimeout(loadingTimer.current);
    loadingTimer.current = setTimeout(() => {
      const result = generateResult(answers, questions);
      const saved = saveHistoryRecord(answers, result);
      const target = comparisonTarget.current;
      comparisonTarget.current = null;
      if (!saved) {
        setUnsavedResult(result);
        setNotice('本机存储空间不足，画像暂未存档。请保留当前页面。');
        navigate('result');
        return;
      }
      if (target) { setComparisonRecordId(saved.id); navigate('compare', target); }
      else navigate('result', saved.id);
    }, LOADING_DURATION);
  };

  const openMy = () => {
    navigate('me');
  };
  const openRecord = async (item) => {
    try {
      if (!item.localPresent) await downloadRecord(item);
      setNotice(''); navigate('result', item.id);
    } catch (error) { setNotice(error.message); }
  };
  const removeLocal = (id) => {
    try { removeLocalRecord(id); setNotice('本机画像已删除，云端副本与分享状态不变'); }
    catch (error) { setNotice(error.message); }
  };
  const clearLocal = () => {
    let failed = false;
    for (const record of records) {
      if (record.localPresent) { try { removeLocalRecord(record.id); } catch { failed = true; } }
    }
    setNotice(failed ? '部分记录有待确认操作或本机存储无法更新，尚未清除。云端副本与分享状态不变。' : '本机画像已清空，云端副本与分享状态不变');
  };
  const refresh = async () => {
    try { await refreshCloudHistory(); setNotice('云端状态已核实'); }
    catch (error) { setNotice(error.message); }
  };
  const retryPending = async () => {
    try { await flushPending(); await refreshCloudHistory(); setNotice('待处理操作已完成'); }
    catch (error) { setNotice(error.message); }
  };
  const myPage = <My records={records} account={account} notice={notice} onBack={home} onOpen={openRecord}
    onDeleteLocal={removeLocal} onClearLocal={clearLocal} onRefresh={refresh} onRetryPending={retryPending}
    pendingLegacy={getAllHistoryRecords().filter((item) => item.deletedAt).length} />;
  const record = records.find((item) => item.id === route.id);
  let content;
  switch (route.screen) {
    case 'about': content = <About onBack={home} onOpenArchetypes={() => navigate('archetypes')} onOpenTraits={() => navigate('traits')} onOpenQuestions={() => navigate('questions')} />; break;
    case 'archetypes': content = <Archetypes onBack={() => navigate('about')} />; break;
    case 'traits': content = <Traits onBack={() => navigate('about')} />; break;
    case 'questions': content = <Questions onBack={() => navigate('about')} />; break;
    case 'me': content = myPage; break;
    case 'test': content = <Test onComplete={complete} />; break;
    case 'loading': content = <Loading />; break;
    case 'result': content = record?.result || unsavedResult
      ? <Result result={record?.result || unsavedResult} record={record} onRestart={home} onOpenMy={openMy} />
      : myPage; break;
    case 'view':
    case 'compare': content = <SharedProfile shareId={route.id} mode={route.screen} records={records} selectedRecordId={comparisonRecordId}
      cached={peer?.shareId === route.id ? peer.profile : null}
      onLoaded={(profile) => setPeer({ shareId: route.id, profile })}
      onHome={home} onCompare={() => { setComparisonRecordId(null); navigate('compare', route.id); }} onView={() => navigate('view', route.id)}
      onStart={() => start(route.id)} />; break;
    default: content = <Landing onStart={() => start()} onExplore={() => navigate('about')} onOpenMy={openMy} />;
  }

  return <div className="min-h-[100svh] bg-blur-bg">
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div key={`${route.screen}/${route.id || ''}`} custom={direction} variants={pageVariants}
        initial="enter" animate="center" exit="exit" transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ willChange: 'filter, transform, opacity', contain: 'layout style paint' }}>
        {content}
      </motion.div>
    </AnimatePresence>
  </div>;
}
