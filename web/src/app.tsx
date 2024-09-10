import { Summary } from './components/summary'
import { Dialog } from './components/ui/dialog'
import { CreateGoal } from './components/create-goal'
// import { EmptyGoals } from './components/empty-goals'

export function App() {
  return (
    <Dialog>
      {/* <EmptyGoals /> */}
      <Summary />
      <CreateGoal />
    </Dialog>
  )
}


