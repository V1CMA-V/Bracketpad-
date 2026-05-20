import { Analytics } from '@/components/category/analytics'
import { Favorites } from '@/components/category/favorites'
import { Hero } from '@/components/category/hero'
import { MenuCategories } from '@/components/category/menu-categories'
import { NumbersCategory } from '@/components/category/numbers-category'
import { PlayersRegistered } from '@/components/category/players-registered'
import { Regulations } from '@/components/category/regulations'
import { Rounds } from '@/components/category/rounds'
import { SquareBracket } from '@/components/category/square-bracket'
import { Breadcrumb } from '@/components/club/breadcrumb'

export default async function TorneoCategoriaPage({
  params,
}: {
  params: Promise<{ clubSlug: string; slug: string; catSlug: string }>
}) {
  const { catSlug } = await params
  return (
    <div className="flex flex-col gap-10">
      <Breadcrumb path={catSlug} />
      <Hero name={catSlug} />
      <MenuCategories />
      <NumbersCategory />
      <Favorites />
      <SquareBracket />
      <Rounds />
      <PlayersRegistered />
      <Analytics />
      <Regulations />
    </div>
  )
}
