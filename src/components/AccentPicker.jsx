import { Check } from 'lucide-react';
import { PortraitMark } from './PersonalElements';
import { ACCENTS, DEFAULT_INK, FOLLOW, accentSummary, resolveAccent } from '../../shared/accents.js';

/**
 * 主色选择器，放在「编辑资料」里：名字、简介、主色是同一件事——你希望别人怎么看到你。
 * 受控组件：改动只回传给父级，保存由弹窗的「保存资料」一起提交。
 */
export default function AccentPicker({ value = FOLLOW, profile, onChange }) {
  const preview = resolveAccent({ accent: value }, profile);
  const followColor = profile?.color || DEFAULT_INK;

  return <div className="pp-accent">
    <div className="pp-accent-head">
      <PortraitMark color={preview} />
      <div className="pp-accent-copy">
        <span className="pp-accent-label">主色</span>
        <strong>{accentSummary({ accent: value }, profile)}</strong>
      </div>
    </div>

    <div className="pp-swatches" role="radiogroup" aria-label="主色">
      <button type="button" role="radio" aria-checked={value === FOLLOW} className="pp-follow"
        style={{ '--dot': followColor.join(',') }} onClick={() => onChange(FOLLOW)}>
        <span className="pp-swatch-dot is-follow" aria-hidden="true" />
        <span className="pp-follow-copy">
          <strong>跟随画像</strong>
          <small>{profile?.title ? `用「${profile.title}」的原型色，换画像时一起变` : '用当前展示画像的原型色'}</small>
        </span>
        {value === FOLLOW && <Check className="pp-follow-check" size={14} aria-hidden="true" />}
      </button>
      {ACCENTS.map((accent) => <button type="button" key={accent.key} role="radio" aria-checked={value === accent.key}
        aria-label={accent.name} className="pp-swatch" style={{ '--dot': accent.rgb.join(',') }}
        onClick={() => onChange(accent.key)}>
        <span className="pp-swatch-dot" aria-hidden="true" />
        <span className="pp-swatch-name">{accent.name}</span>
      </button>)}
    </div>
  </div>;
}
