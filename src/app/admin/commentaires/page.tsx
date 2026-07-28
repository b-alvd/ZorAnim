import { getAllCommentsWithStats } from "@/db/queries";
import Pagination from "@/components/Pagination/Pagination";
import CommentsList from "./CommentsList";
import styles from "../shared.module.css";

const PAGE_SIZE = 20;

export default async function AdminCommentairesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const allComments = await getAllCommentsWithStats();

  const childrenByParent = new Map<string, typeof allComments>();
  for (const c of allComments) {
    if (!c.parentId) continue;
    const arr = childrenByParent.get(c.parentId) ?? [];
    arr.push(c);
    childrenByParent.set(c.parentId, arr);
  }
  const topLevel = allComments.filter((c) => !c.parentId);

  const { page: pageParam } = await searchParams;
  const totalPages = Math.max(1, Math.ceil(topLevel.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(pageParam) || 1), totalPages);
  const pagedTopLevel = topLevel.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const visibleIds = new Set<string>();
  const collect = (id: string) => {
    visibleIds.add(id);
    for (const child of childrenByParent.get(id) ?? []) collect(child.id);
  };
  for (const c of pagedTopLevel) collect(c.id);

  const comments = allComments.filter((c) => visibleIds.has(c.id));

  return (
    <main>
      <div className={styles.header}>
        <h1 className={styles.title}>Commentaires</h1>
      </div>
      <CommentsList comments={comments} />
      <Pagination page={page} totalPages={totalPages} basePath="/admin/commentaires" />
    </main>
  );
}
