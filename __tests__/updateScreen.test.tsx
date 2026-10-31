import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { PREVIEW_UPDATE_INFO, UpdateScreen } from '../src/screens/UpdateScreen';
import type { UpdateInfo } from '../src/update/appUpdate';
import { UPDATE_POLICY } from '../src/update/policy';

let mockParams: { info: UpdateInfo; preview?: boolean };
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ canGoBack: () => true, goBack: mockGoBack }),
  useRoute: () => ({ params: mockParams }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

function allText(r: ReactTestRenderer): string {
  return r.root
    .findAll(n => (n.type as unknown) === 'Text')
    .map(n =>
      (Array.isArray(n.props.children) ? n.props.children : [n.props.children])
        .filter((c: unknown) => typeof c === 'string')
        .join(''),
    )
    .join('\n');
}

async function render(info: UpdateInfo) {
  mockParams = { info };
  let r!: ReactTestRenderer;
  await act(async () => {
    r = create(<UpdateScreen />);
  });
  return r;
}

describe('업데이트 권유 화면', () => {
  it('지금 버전과 새 버전, 두 버튼을 보여준다', async () => {
    const text = allText(await render(PREVIEW_UPDATE_INFO));
    expect(text).toContain('새 버전이\n나왔어요');
    expect(text).toContain('v1.0');
    expect(text).toContain('BUILD 2');
    expect(text).toContain('지금 업데이트');
    expect(text).toContain('나중에');
    expect(text).toContain(`${UPDATE_POLICY.snoozeDays}일 뒤에`);
  });

  it('꼭 필요한 업데이트면 "나중에"가 없다', async () => {
    const text = allText(
      await render({
        ...PREVIEW_UPDATE_INFO,
        priority: UPDATE_POLICY.forcePriority,
      }),
    );
    expect(text).toContain('업데이트가\n필요해요');
    expect(text).not.toContain('나중에');
  });
});
