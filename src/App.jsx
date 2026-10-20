import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, useMotionValue } from 'framer-motion';
import PageTransition from './components/PageTransition';
import AppBackground from './components/AppBackground';
import { nextPageRoute, pageKey } from './utils/pageTransitions';
import Landing from './pages/Landing';
import Test from './pages/Test';
import Loading from './pages/Loading';
import Result from './pages/Result';
import About from './pages/About';
import Next from './pages/Next';
import Archetypes from './pages/Archetypes';
import Traits from './pages/Traits';
import Questions from './pages/Questions';
import My from './pages/My';
import SharedProfile from './pages/SharedProfile';
import Identity from './pages/Identity';
import Invite from './pages/Invite';
import FriendProfile from './pages/FriendProfile';
import Admin from './pages/Admin';
import { generateResult, solveProfile } from './utils/blurEngine';
import { buildPersonaSymbols, revealAt } from './utils/personaSymbols';
import { questions } from './data/questions';
import { getHistoryRecords, getAllHistoryRecords, saveHistoryRecord, removeLocalRecord } from './utils/historyStorage';
import { flushPending, refreshCloudHistory, downloadRecord, signOut, deleteIdentity } from './utils/cloud';
import { getAccountInfo, ensureLocalIdentity, updateAccountInfo } from './utils/identity';
import { selectPortrait } from './utils/people';
import { recordEvent } from './utils/metrics';

const LOADING_DURATION = 3500;
const INITIAL_TEST_SYMBOLS = buildPersonaSymbols(solveProfile([]).field, revealAt(0));

function readRoute() {
  const [screen, id] = window.location.hash.slice(1).split('/');
  if (screen === 'invite') return /^[A-Fa-f0-9]{12}$/.test(id || '') ? { screen, id: id.toUpperCase() } : { screen: 'me', id: 'friends' };
  if (['friend', 'together'].includes(screen)) return /^[a-f0-9]{32}$/.test(id || '') ? { screen, id } : { screen: 'me', id: 'friends' };
  if (screen === 'identity') return { screen, id: /^(profile|friends|settings|invite-[A-Fa-f0-9]{12}|friend-[a-f0-9]{32}|together-[a-f0-9]{32})$/.test(id || '') ? id : 'profile' };
  if (screen === 'me') return { screen, id: ['history', 'friends', 'settings'].includes(id) ? id : 'profile' };
  if (['view', 'compare'].includes(screen)) {
    return /^[a-f0-9]{32}$/.test(id || '') ? { screen, id } : { screen: 'landing' };
  }
  if (screen === 'result') return getHistoryRecords().some((record) => record.id === id && record.localPresent)
    ? { screen, id } : { screen: 'me' };
  if (screen === 'history') return { screen: 'me' };
  return { screen: ['about', 'next', 'archetypes', 'traits', 'questions', 'me', 'admin'].includes(screen) ? screen : 'landing' };
}

export default function App() {
  const [route, setRoute] = useState(() => ({ ...readRoute(), direction: 1 }));
  const [background, setBackground] = useState(() => ({ screen: route.screen, present: true }));
  // One animation value drives both sibling layers, including the transparent
  // boundary where wait-mode navigation replaces the foreground page.
  const pageOpacity = useMotionValue(1);
  const [testSymbols, setTestSymbols] = useState(INITIAL_TEST_SYMBOLS);
  const [records, setRecords] = useState(getHistoryRecords);
  const [account, setAccount] = useState(getAccountInfo);
  const [unsavedResult, setUnsavedResult] = useState(null);
  // Only a portrait finished in this session may invite an identity; opening an
  // old record from history must stay quiet.
  const [justFinished, setJustFinished] = useState(false);
  const [notice, setNotice] = useState('');
  // The "next" page is reachable from two places; its back button returns to the one you came from.
  const [nextFrom, setNextFrom] = useState('landing');
  const [peer, setPeer] = useState(null);
  const [comparisonRecordId, setComparisonRecordId] = useState(null);
  const loadingTimer = useRef(null);
  const comparisonTarget = useRef(null);
  const accountId = useRef(account.id);

  const syncBackground = useCallback((screen, present) => {
    setBackground((previous) => previous.screen === screen && previous.present === present
      ? previous : { screen, present });
  }, []);

  const navigate = useCallback((screen, id) => {
    setRoute((previous) => nextPageRoute(previous, { screen, id }));
    const hash = screen === 'landing' ? '' : `#${screen}${id ? `/${id}` : ''}`;
    // A second tap during exit must not add another identical history entry.
    if (window.location.hash !== hash) {
      window.history.pushState(null, '', hash || window.location.pathname + window.location.search);
    }
  }, []);

  useEffect(() => {
    const changed = () => {
      const next = getAccountInfo();
      if (next.id !== accountId.current) { setPeer(null); setComparisonRecordId(null); accountId.current = next.id; }
      setRecords(getHistoryRecords()); setAccount(next);
    };
    const back = () => {
      clearTimeout(loadingTimer.current);
      const next = readRoute();
      setRoute((previous) => nextPageRoute(previous, next));
    };
    window.addEventListener('blur-history-change', changed);
    window.addEventListener('blur-account-change', changed);
    window.addEventListener('storage', changed);
    window.addEventListener('popstate', back);
    window.addEventListener('hashchange', back);
    // Adopt the existing latest portrait once when upgrading an older browser.
    const info = getAccountInfo();
    const initial = getHistoryRecords()[0];
    if (initial && !info.registered && info.displayRecordId === undefined && !info.portraitId) {
      try { updateAccountInfo({ displayRecordId: initial.id }); } catch { /* Local records remain available. */ }
    }
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
    if (!['me', 'invite', 'friend', 'together'].includes(route.screen)) return;
    let active = true;
    ensureLocalIdentity().then(refreshCloudHistory).then(() => { if (active) setNotice(''); })
      .catch(() => { if (active) setNotice('暂时无法更新云端状态。画像已保存在本机，可以稍后重试。'); });
    return () => { active = false; };
  }, [route.screen]);

  const home = () => {
    clearTimeout(loadingTimer.current);
    comparisonTarget.current = null;
    setJustFinished(false);
    navigate('landing');
  };

  const openNext = (from) => {
    setNextFrom(from === 'about' ? 'about' : 'landing');
    navigate('next');
  };

  const start = (shareId = null) => {
    recordEvent('test_started');
    comparisonTarget.current = shareId;
    setComparisonRecordId(null);
    setUnsavedResult(null);
    setJustFinished(false);
    setTestSymbols(INITIAL_TEST_SYMBOLS);
    navigate('test');
  };

  const complete = (answers) => {
    navigate('loading');
    clearTimeout(loadingTimer.current);
    loadingTimer.current = setTimeout(() => {
      recordEvent('test_completed');
      const result = generateResult(answers, questions);
      const saved = saveHistoryRecord(answers, result);
      const target = comparisonTarget.current;
      comparisonTarget.current = null;
      if (!saved) {
        setUnsavedResult(result);
        setJustFinished(false);
        setNotice('本机存储空间不足，画像暂未存档。请保留当前页面。');
        navigate('result');
        return;
      }
      if (getAccountInfo().displayRecordId === undefined && !getAccountInfo().portraitId) {
        try { updateAccountInfo({ displayRecordId: saved.id }); } catch { /* The snapshot itself is already saved. */ }
      }
      // Finishing a test never uploads anything. Saving to the cloud is explicit.
      if (target) { setComparisonRecordId(saved.id); navigate('compare', target); }
      else { setJustFinished(true); navigate('result', saved.id); }
    }, LOADING_DURATION);
  };

  const openMy = () => {
    navigate('me');
  };
  const openRecord = async (item) => {
    try {
      setJustFinished(false);
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
  // The only way a portrait reaches the cloud: an explicit tap, here or in record management.
  const syncPortrait = async (item) => {
    try { await selectPortrait(item); setNotice(''); }
    catch (error) { setNotice(error.message); }
  };
  // Both actions end on the landing page: the account listener has already
  // swapped the identity out, so staying on "me" would only show an empty shell.
  const leaveDevice = async () => {
    await signOut();
    navigate('landing');
  };
  const removeIdentity = async (options) => {
    await deleteIdentity(options);
    navigate('landing');
  };
  // Reading/parsing the full history is only needed when this page is displayed.
  const myPage = () => <My records={records} account={account} notice={notice} onBack={home} onOpen={openRecord}
    onDeleteLocal={removeLocal} onClearLocal={clearLocal} onRefresh={refresh} onRetryPending={retryPending}
    onStartTest={() => start()} onSignOut={leaveDevice} onDeleteIdentity={removeIdentity} onSyncPortrait={syncPortrait}
    tab={['history', 'friends', 'settings'].includes(route.id) ? route.id : 'profile'} onTab={(tab) => navigate('me', tab)}
    onCreateIdentity={() => navigate('identity', ['friends', 'settings'].includes(route.id) ? route.id : 'profile')}
    onFriend={(id) => navigate('friend', id)}
    pendingLegacy={getAllHistoryRecords().filter((item) => item.deletedAt).length} />;
  const record = records.find((item) => item.id === route.id);
  let content;
  switch (route.screen) {
    case 'about': content = <About onBack={home} onStart={() => start()} onOpenArchetypes={() => navigate('archetypes')} onOpenTraits={() => navigate('traits')} onOpenQuestions={() => navigate('questions')} onOpenNext={() => openNext('about')} />; break;
    case 'next': content = <Next onBack={() => navigate(nextFrom)} onStart={() => start()} onOpenMy={openMy} />; break;
    case 'archetypes': content = <Archetypes onBack={() => navigate('about')} />; break;
    case 'traits': content = <Traits onBack={() => navigate('about')} />; break;
    case 'questions': content = <Questions onBack={() => navigate('about')} />; break;
    case 'me': content = myPage(); break;
    case 'admin': content = <Admin onBack={home} />; break;
    case 'identity': content = <Identity account={account} onBack={openMy} onDone={() => {
      const [target, id] = (route.id || 'profile').split('-');
      if (['invite', 'friend', 'together'].includes(target)) navigate(target, id);
      else navigate('me', target);
    }} />; break;
    case 'invite': content = <Invite code={route.id} account={account} onBack={home}
      onCreate={() => navigate('identity', `invite-${route.id}`)} onFriends={() => navigate('me', 'friends')} />; break;
    case 'friend':
    case 'together': content = <FriendProfile key={`${account.id}/${route.screen}/${route.id}`} publicId={route.id} account={account} mode={route.screen}
      onBack={() => navigate('me', 'friends')} onCreate={() => navigate('identity', `${route.screen}-${route.id}`)}
      onCompare={() => navigate('together', route.id)} onView={() => navigate('friend', route.id)} onMy={openMy} />; break;
    case 'test': content = <Test onComplete={complete} onSymbolsChange={setTestSymbols} onExit={home} />; break;
    case 'loading': content = <Loading />; break;
    case 'result': content = record?.result || unsavedResult
      ? <Result result={record?.result || unsavedResult} record={record} account={account} justFinished={justFinished}
        onRestart={home} onOpenMy={openMy} onPermissions={() => navigate('me', 'settings')} />
      : myPage(); break;
    case 'view':
    case 'compare': content = <SharedProfile shareId={route.id} mode={route.screen} records={records} selectedRecordId={comparisonRecordId}
      cached={peer?.shareId === route.id ? peer.profile : null}
      onLoaded={(profile) => setPeer({ shareId: route.id, profile })}
      onHome={home} onCompare={() => { setComparisonRecordId(null); navigate('compare', route.id); }} onView={() => navigate('view', route.id)}
      onStart={() => start(route.id)} />; break;
    default: content = <Landing onStart={() => start()} onExplore={() => navigate('about')} onOpenMy={openMy} onOpenNext={() => openNext('landing')} />;
  }

  return <div className="relative isolate min-h-[100svh] bg-blur-bg">
    <AppBackground screen={background.screen} present={background.present} testSymbols={testSymbols} opacity={pageOpacity} />
    <AnimatePresence mode="wait" custom={route.direction}>
      <PageTransition key={pageKey(route)} direction={route.direction} screen={route.screen} onTransition={syncBackground} opacity={pageOpacity}>
        {content}
      </PageTransition>
    </AnimatePresence>
  </div>;
}
