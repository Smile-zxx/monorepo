import { MobxTable } from "@/components/MobxTable";
import { Button, Input, Typography, Divider } from "@arco-design/web-react";
import type { ColumnProps } from "@arco-design/web-react/es/Table";

// 定义数据结构
interface Note {
    id: number;
    title: string;
    content: string;
    createdAt: string;
}

// 列定义
const columns: ColumnProps<Note>[] = [
    {
        title: "ID",
        dataIndex: "id",
        width: 80,
    },
    {
        title: "标题",
        dataIndex: "title",
        width: 200,
    },
    {
        title: "内容",
        dataIndex: "content",
        ellipsis: true,
    },
    {
        title: "创建时间",
        dataIndex: "createdAt",
        width: 180,
    },
];

// mock fetcher
const mockNotes: Note[] = Array.from({ length: 55 }).map((_, idx) => ({
    id: idx + 1,
    title: `笔记${idx + 1}`,
    content: `这是第${idx + 1}条笔记的内容，演示用mock数据。`,
    createdAt: `2024-06-0${(idx % 9) + 1} 12:00`,
}));

const fetcher = async (params: any) => {
    const { current = 1, pageSize = 10, filterValues } = params;

    // 简单的 mock 筛选逻辑
    let data = [...mockNotes];
    if (filterValues) {
        if (filterValues.title) {
            data = data.filter(item => item.title.includes(filterValues.title));
        }
    }

    const start = (current - 1) * pageSize;
    const end = start + pageSize;

    console.log('Fetching data:', { current, pageSize, filterValues });

    return new Promise<{ list: Note[]; total: number }>((resolve) => {
        setTimeout(() => {
            resolve({
                list: data.slice(start, end),
                total: data.length,
            });
        }, 500);
    });
};

// 定义 toolbar 配置
const toolbar = [
    {
        name: 'title',
        label: '标题',
        component: ({ value, onChange }: any) => (
            <Input
                value={value}
                onChange={onChange}
                placeholder="请输入标题搜索"
                style={{ width: 200 }}
                allowClear
            />
        ),
    },
    {
        name: 'refreshBtn',
        label: '',
        component: ({ table }: any) => (
            <Button onClick={() => table.refresh()}>刷新</Button>
        ),
    }
];

const Notes = () => {
    return (
        <div id="warp" className="p-4 space-y-8">
            <Typography.Title heading={3}>MobxTable 演示</Typography.Title>

            <section>
                <Typography.Title heading={5}>1. Remote 模式 (默认)</Typography.Title>
                <div className="text-gray-500 mb-4">每次分页、排序、筛选都会请求后端接口。</div>
                <MobxTable
                    mode="remote"
                    columns={columns}
                    fetcher={fetcher}
                    toolbar={toolbar}
                    initialPagination={{ pageSize: 5 }}
                />
            </section>

            <Divider />

            <section>
                <Typography.Title heading={5}>2. LoadMore 模式</Typography.Title>
                <div className="text-gray-500 mb-4">无限滚动风格，点击“加载更多”追加数据。</div>
                <MobxTable
                    mode="loadmore"
                    columns={columns}
                    fetcher={fetcher}
                    toolbar={toolbar}
                    initialPagination={{ pageSize: 5 }}
                />
            </section>

            <Divider />

            <section>
                <Typography.Title heading={5}>3. Local 模式</Typography.Title>
                <div className="text-gray-500 mb-4">一次性获取所有数据（模拟接口返回全量），前端分页。</div>
                <MobxTable
                    mode="local"
                    columns={columns}
                    // Local 模式的 fetcher 模拟一次性返回全量数据
                    fetcher={async () => {
                        return new Promise<{ list: Note[]; total: number }>((resolve) => {
                            setTimeout(() => resolve({ list: mockNotes, total: mockNotes.length }), 800);
                        });
                    }}
                    toolbar={toolbar}
                    initialPagination={{ pageSize: 5 }}
                />
            </section>
        </div>
    );
}

export default Notes;
