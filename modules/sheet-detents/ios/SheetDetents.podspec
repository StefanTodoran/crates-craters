Pod::Spec.new do |s|
  s.name           = 'SheetDetents'
  s.version        = '1.0.0'
  s.summary        = 'Half-height, see-through sheets for React Native modals.'
  s.author         = ''
  s.homepage       = 'https://todoran.dev'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
end
