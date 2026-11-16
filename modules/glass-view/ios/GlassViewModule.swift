import ExpoModulesCore
import UIKit

public class GlassViewModule: Module {
  static var isSupported: Bool {
    if #available(iOS 26.0, *) { return true }
    return false
  }

  public func definition() -> ModuleDefinition {
    Name("GlassView")

    Constants(["isAvailable": Self.isSupported])

    View(GlassView.self) {
      Prop("tint") { (view: GlassView, tint: UIColor?) in
        view.tint = tint
      }
      // Omitted: a capsule (fully rounded ends).
      Prop("cornerRadius") { (view: GlassView, radius: Double?) in
        view.cornerRadius = radius.map { CGFloat($0) }
      }
    }
  }
}

/// A Liquid Glass background. Render it behind content (absolute fill), without children.
class GlassView: ExpoView {
  private let effectView = UIVisualEffectView()

  var tint: UIColor? { didSet { applyEffect() } }
  var cornerRadius: CGFloat? { didSet { applyShape() } }

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    backgroundColor = .clear
    effectView.frame = bounds
    effectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    addSubview(effectView)
    applyEffect()
    applyShape()
  }

  private func applyEffect() {
    if #available(iOS 26.0, *) {
      let effect = UIGlassEffect(style: .regular)
      effect.tintColor = tint
      effectView.effect = effect
    } else {
      effectView.effect = UIBlurEffect(style: .systemThinMaterial)
      effectView.contentView.backgroundColor = tint?.withAlphaComponent(0.6)
    }
  }

  private func applyShape() {
    if #available(iOS 26.0, *) {
      if let radius = cornerRadius {
        effectView.cornerConfiguration = .uniformCorners(radius: .fixed(radius))
      } else {
        effectView.cornerConfiguration = .capsule()
      }
    } else {
      effectView.clipsToBounds = true
      setNeedsLayout()
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    if #unavailable(iOS 26.0) {
      effectView.layer.cornerRadius = cornerRadius ?? bounds.height / 2
      effectView.layer.cornerCurve = .continuous
    }
  }
}
