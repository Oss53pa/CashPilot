import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ApprovalActionsProps {
  onApprove: (comments: string | null) => void;
  onReject: (comments: string | null) => void;
  isLoading?: boolean;
}

export function ApprovalActions({ onApprove, onReject, isLoading }: ApprovalActionsProps) {
  const [comments, setComments] = useState('');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Approval Decision</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Add comments (optional)..."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={3}
        />
        <div className="flex gap-2">
          <Button
            onClick={() => onApprove(comments || null)}
            disabled={isLoading}
            className="flex-1"
          >
            Approve
          </Button>
          <Button
            variant="destructive"
            onClick={() => onReject(comments || null)}
            disabled={isLoading}
            className="flex-1"
          >
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
