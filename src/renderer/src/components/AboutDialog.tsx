import { useAtom } from 'jotai'
import { aboutDialogOpenAtom } from '@renderer/store'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { LuBrain, LuExternalLink } from 'react-icons/lu'
import { appDirectoryName } from '@shared/constants'

export const AboutDialog = () => {
  const [open, setOpen] = useAtom(aboutDialogOpenAtom)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LuBrain className="h-5 w-5" />
            About Tesseract
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tesseract is a local-first, AI-enhanced markdown notebook. Your notes live as plain
            <code className="mx-1 text-xs bg-muted px-1 rounded">.md</code>
            files on your machine — no cloud, no accounts.
          </p>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-bold text-sm mb-2">Built by the Masons Team</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This is the graduation project of{' '}
              <a
                href="https://seifzellaban.wiki"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Seif Zakaria
                <LuExternalLink className="h-3 w-3" />
              </a>
              , Omar Adel, Beshoy Mahrous, and Boles Sa&apos;ad.
            </p>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              Notes stored at{' '}
              <code className="bg-muted px-1 rounded">~/{appDirectoryName}/Notes/</code>
            </p>
            <p>
              Session data in{' '}
              <code className="bg-muted px-1 rounded">~/{appDirectoryName}/tesseract.db</code>
            </p>
            <p>
              AI powered by{' '}
              <a
                href="https://opencode.ai/zen"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                OpenCode Zen
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
