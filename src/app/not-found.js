import Button1 from '@/components/button/Button1'
export default function NotFound() {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 space-y-6">
        <h1 className="text-5xl font-bold text-red-600">☹️ Oeps!</h1>
        <p className="mt-2 text-2xl">Foutcode 404: Pagina niet gevonden</p>
        <Button1 text={"Terug naar leren"} redirectTo={'/home/start'}/>
      </div>
    );``
  }
  