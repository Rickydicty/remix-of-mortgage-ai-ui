import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Upload, Loader2, FileText } from 'lucide-react';

interface LoanOfferUploadProps {
  applicationId: string;
  clientUserId: string;
  onUploadComplete: () => void;
}

const MOCK_OFFERS = [
  {
    lender_name: 'Haven Mortgages',
    offer_amount: 130500,
    interest_rate: 3.75,
    loan_term: 30,
    monthly_repayment: 604.55,
    offer_type: 'fixed',
    fixed_period: 5,
    total_repayment: 216342.20,
    document_url: '/mock-offers/Haven_Loan_Offer_Sample.pdf'
  },
  {
    lender_name: 'AIB Mortgages',
    offer_amount: 150000,
    interest_rate: 3.95,
    loan_term: 25,
    monthly_repayment: 784.32,
    offer_type: 'fixed',
    fixed_period: 3,
    total_repayment: 235296.00,
    document_url: null
  },
  {
    lender_name: 'Bank of Ireland',
    offer_amount: 175000,
    interest_rate: 4.10,
    loan_term: 30,
    monthly_repayment: 845.23,
    offer_type: 'variable',
    fixed_period: null,
    total_repayment: 304282.80,
    document_url: null
  }
];

export function LoanOfferUpload({ applicationId, clientUserId, onUploadComplete }: LoanOfferUploadProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<'mock' | 'manual'>('mock');
  const [selectedMock, setSelectedMock] = useState<string>('');
  
  // Manual entry fields
  const [lenderName, setLenderName] = useState('');
  const [offerAmount, setOfferAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [loanTerm, setLoanTerm] = useState('');
  const [monthlyRepayment, setMonthlyRepayment] = useState('');
  const [offerType, setOfferType] = useState('fixed');
  const [fixedPeriod, setFixedPeriod] = useState('');
  const [totalRepayment, setTotalRepayment] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleAddMockOffer = async () => {
    if (!selectedMock) {
      toast.error('Please select a mock offer');
      return;
    }

    const mockOffer = MOCK_OFFERS.find(o => o.lender_name === selectedMock);
    if (!mockOffer) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('loan_offers')
        .insert({
          application_id: applicationId,
          lender_name: mockOffer.lender_name,
          offer_amount: mockOffer.offer_amount,
          interest_rate: mockOffer.interest_rate,
          loan_term: mockOffer.loan_term,
          monthly_repayment: mockOffer.monthly_repayment,
          offer_type: mockOffer.offer_type,
          fixed_period: mockOffer.fixed_period,
          total_repayment: mockOffer.total_repayment,
          document_url: mockOffer.document_url,
          is_mock: true,
          status: 'active',
          created_by: user.id
        });

      if (error) throw error;

      toast.success('Mock loan offer added successfully');
      setOpen(false);
      onUploadComplete();
    } catch (error) {
      console.error('Error adding mock offer:', error);
      toast.error('Failed to add mock offer');
    } finally {
      setUploading(false);
    }
  };

  const handleAddManualOffer = async () => {
    if (!lenderName || !offerAmount || !interestRate || !loanTerm) {
      toast.error('Please fill in all required fields');
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let documentUrl = null;

      // Upload file if provided
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `loan-offers/${applicationId}/${Date.now()}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName);
        
        documentUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('loan_offers')
        .insert({
          application_id: applicationId,
          lender_name: lenderName,
          offer_amount: parseFloat(offerAmount),
          interest_rate: parseFloat(interestRate),
          loan_term: parseInt(loanTerm),
          monthly_repayment: monthlyRepayment ? parseFloat(monthlyRepayment) : null,
          offer_type: offerType,
          fixed_period: fixedPeriod ? parseInt(fixedPeriod) : null,
          total_repayment: totalRepayment ? parseFloat(totalRepayment) : null,
          offer_valid_until: validUntil || null,
          document_url: documentUrl,
          notes: notes || null,
          is_mock: false,
          status: 'active',
          created_by: user.id
        });

      if (error) throw error;

      toast.success('Loan offer added successfully');
      setOpen(false);
      resetForm();
      onUploadComplete();
    } catch (error) {
      console.error('Error adding offer:', error);
      toast.error('Failed to add loan offer');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setLenderName('');
    setOfferAmount('');
    setInterestRate('');
    setLoanTerm('');
    setMonthlyRepayment('');
    setOfferType('fixed');
    setFixedPeriod('');
    setTotalRepayment('');
    setValidUntil('');
    setNotes('');
    setFile(null);
    setSelectedMock('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Loan Offer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Loan Offer</DialogTitle>
          <DialogDescription>
            Add a loan offer for the client to review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mode Selection */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'mock' ? 'default' : 'outline'}
              onClick={() => setMode('mock')}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              Use Mock Offer
            </Button>
            <Button
              variant={mode === 'manual' ? 'default' : 'outline'}
              onClick={() => setMode('manual')}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Manual Entry
            </Button>
          </div>

          {mode === 'mock' ? (
            /* Mock Offer Selection */
            <div className="space-y-4">
              <Label>Select Mock Offer</Label>
              <Select value={selectedMock} onValueChange={setSelectedMock}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a sample offer..." />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_OFFERS.map((offer) => (
                    <SelectItem key={offer.lender_name} value={offer.lender_name}>
                      {offer.lender_name} - €{offer.offer_amount.toLocaleString()} @ {offer.interest_rate}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedMock && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                  {(() => {
                    const offer = MOCK_OFFERS.find(o => o.lender_name === selectedMock);
                    if (!offer) return null;
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div><strong>Lender:</strong> {offer.lender_name}</div>
                          <div><strong>Amount:</strong> €{offer.offer_amount.toLocaleString()}</div>
                          <div><strong>Rate:</strong> {offer.interest_rate}% ({offer.offer_type})</div>
                          <div><strong>Term:</strong> {offer.loan_term} years</div>
                          <div><strong>Monthly:</strong> €{offer.monthly_repayment?.toLocaleString()}</div>
                          <div><strong>Total:</strong> €{offer.total_repayment?.toLocaleString()}</div>
                        </div>
                        {offer.document_url && (
                          <p className="text-xs text-muted-foreground pt-2 border-t">
                            Includes sample PDF document
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              <Button 
                onClick={handleAddMockOffer} 
                disabled={!selectedMock || uploading}
                className="w-full"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Mock Offer
              </Button>
            </div>
          ) : (
            /* Manual Entry Form */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Lender Name *</Label>
                  <Input 
                    value={lenderName} 
                    onChange={(e) => setLenderName(e.target.value)}
                    placeholder="e.g., Haven Mortgages"
                  />
                </div>
                <div>
                  <Label>Offer Amount (€) *</Label>
                  <Input 
                    type="number"
                    value={offerAmount} 
                    onChange={(e) => setOfferAmount(e.target.value)}
                    placeholder="150000"
                  />
                </div>
                <div>
                  <Label>Interest Rate (%) *</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={interestRate} 
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="3.75"
                  />
                </div>
                <div>
                  <Label>Loan Term (years) *</Label>
                  <Input 
                    type="number"
                    value={loanTerm} 
                    onChange={(e) => setLoanTerm(e.target.value)}
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label>Monthly Repayment (€)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={monthlyRepayment} 
                    onChange={(e) => setMonthlyRepayment(e.target.value)}
                    placeholder="604.55"
                  />
                </div>
                <div>
                  <Label>Rate Type</Label>
                  <Select value={offerType} onValueChange={setOfferType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="variable">Variable</SelectItem>
                      <SelectItem value="split">Split</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fixed Period (years)</Label>
                  <Input 
                    type="number"
                    value={fixedPeriod} 
                    onChange={(e) => setFixedPeriod(e.target.value)}
                    placeholder="5"
                    disabled={offerType !== 'fixed'}
                  />
                </div>
                <div>
                  <Label>Total Repayment (€)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={totalRepayment} 
                    onChange={(e) => setTotalRepayment(e.target.value)}
                    placeholder="216342.20"
                  />
                </div>
                <div>
                  <Label>Valid Until</Label>
                  <Input 
                    type="date"
                    value={validUntil} 
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Upload Loan Offer Document (Optional)</Label>
                <Input 
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes for the client..."
                />
              </div>

              <Button 
                onClick={handleAddManualOffer} 
                disabled={uploading}
                className="w-full"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Loan Offer
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
