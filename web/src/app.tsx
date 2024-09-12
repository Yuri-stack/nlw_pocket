import { useQuery } from '@tanstack/react-query'

import { getSummary } from './http/get-summary'

import { Summary } from './components/summary'
import { Dialog } from './components/ui/dialog'
import { EmptyGoals } from './components/empty-goals'
import { CreateGoal } from './components/create-goal'

export function App() {
  const { data } = useQuery({
    queryKey: ['summary'],
    queryFn: getSummary
  })


  return (
    <Dialog>
      {data?.total && data?.total > 0 ? <Summary /> : <EmptyGoals />}

      <CreateGoal />
    </Dialog>
  )
}


