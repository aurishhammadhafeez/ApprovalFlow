import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const SupabaseTest: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.from('organizations').select('count').limit(1)
      
      if (error) {
        setStatus('error')
        setError(error.message)
      } else {
        setStatus('connected')
      }
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              status === 'loading' ? 'bg-yellow-500' :
              status === 'connected' ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="capitalize">{status}</span>
          </div>
          
          {status === 'error' && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
          
          {status === 'connected' && (
            <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
              ✅ Successfully connected to Supabase!
            </div>
          )}
          
          <Button onClick={testConnection} variant="outline" size="sm">
            Test Connection
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default SupabaseTest 