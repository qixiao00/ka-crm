import { Send } from "lucide-react";
import { Panel } from "@/components/common/Panel";

export function PushConfigView({ managers }: { managers: string[] }) {
  return (
    <Panel title="周执行工作推送配置" subtitle="企微 Webhook、推送时间和推送对象">
      <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <div className="surface-card space-y-4">
          <label className="field">
            <span>企微 Webhook 地址</span>
            <input placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..." />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="field">
              <span>自动推送时间（工作日）</span>
              <input defaultValue="18:00" />
            </label>
            <label className="field">
              <span>时区</span>
              <input defaultValue="Asia/Shanghai" />
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {["包含客户", "包含场景", "包含状态", "包含计划时间"].map((item) => (
              <label key={item} className="checkbox-line">
                <input type="checkbox" defaultChecked />
                <span>{item}</span>
              </label>
            ))}
          </div>
          <button className="primary-button">保存配置</button>
        </div>
        <div className="surface-card">
          <h3 className="font-semibold">推送对象（可多选）</h3>
          <div className="mt-4 grid gap-2">
            {managers.map((manager) => (
              <label key={manager} className="checkbox-line justify-between">
                <span>{manager}</span>
                <input type="checkbox" defaultChecked />
              </label>
            ))}
          </div>
          <button className="secondary-button mt-4 w-full justify-center">
            <Send size={16} />
            立即推送
          </button>
        </div>
      </div>
    </Panel>
  );
}
